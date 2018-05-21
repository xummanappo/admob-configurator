var AdmobV2 = function (publisherId) {
  this.publisherId = publisherId;
  AdmobV2.admobAppsUrl = "https://apps.admob.com/tlcgwt/inventory"; 
  AdmobV2.appodealAppsUrl = APPODEAL_URL_SSL_NOT_WWW + "/admob_plugin/api/v1/apps_with_ad_units";

AdmobV2.prototype.getXsrf = function () {
  var self = this;
  Utils.injectScript('\
    chrome.runtime.sendMessage("' + chrome.runtime.id + '", {type: "admob_notification", amppd_decode: JSON.parse(amppd), amrpd_decode: JSON.parse(amrpd) })');
};

  AdmobV2.prototype.getAppodealApps = function () {
    var self = this;
    json = { account: self.publisherId }
    params = JSON.stringify(json);
    $.ajax({
      method: "GET",
      url: AdmobV2.appodealAppsUrl,
      data: params,
      async: false
    })
      .done(function (data) {
        if (data.applications && data.applications.length) {
          console.log('Syncing Appodeal inventory')
          console.log('Appodeal Apps: ' + data.applications)
          chrome.storage.local.set({
            "appodeal_apps": data.applications
          });
        } else {
          console.log("Appodeal applications not found. Please add applications to Appodeal.");
        }
      })
      .fail(function (data) {
        console.log("Failed to get remote inventory")
      });
  };

  AdmobV2.prototype.getAdmobApps = function () {
    var self = this, params;
    json = {
      method: 'initialize',
      params: {},
      xsrf: self.token
    }
    options = {
      url: AdmobV2.admobAppsUrl
    }
    params = JSON.stringify(json);

    $.ajax({
      method: "POST",
      url: options.url,
      contentType: "application/javascript; charset=UTF-8",
      dataType: "json",
      data: params,
      async: false
    })
      .done(function (data) {
        if (data.result) {
          console.log('Get local inventory');
          console.log(data)
          console.log('Saving data to chrome storage')
          chrome.storage.local.set({
            "admob_apps": data.result[1][1],
            "admob_adunits": data.result[1][2]
          });
          console.log('Saving done!')
        } else {
          console.log("No result in an internal inventory request.");
        }
      })
      .fail(function (data) {
        console.log("Failed to make an internal request.");
      });
  };

  AdmobV2.prototype.getHiddenAdmobApps = function (apps) {
    var self = this;
    console.log("Select active local apps");
    if (apps) {
      self.activeAdmobApps = $.grep(apps, function (localApp, i) {
        return (localApp[19] === 0);
      });
    } else {
      self.activeAdmobApps = [];
    }
  };

  AdmobV2.prototype.getActiveAdmobApps = function (apps) {
    var self = this;
    console.log("Select hidden local apps");
    if (apps) {
      self.hiddenAdmobApps = $.grep(apps, function (localApp, i) {
        return (localApp[19] !== 0);
      });
    } else {
      self.hiddenAdmobApps = [];
    }
  };

  AdmobV2.prototype.filterAdmobApps = function(apps) {
    var self = this;
    console.log('Filtering Admob Apps');
    if (apps) {
      self.getActiveAdmobApps(apps);
      self.getHiddenAdmobApps(apps);
    }
    console.log('Filtering Done')
    console.log(self.hiddenAdmobApps);
    console.log(self.activeAdmobApps)
  };

  AdmobV2.prototype.syncInventory = function () {
    console.log("Sync inventory");
    var self = this;
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
      if (request.type === "to_admob") {
        self.token = request.data.amrpd_decode[32][1];
        self.getAppodealApps();
        self.getAdmobApps();
        chrome.storage.local.get({
          'admob_apps': null
        }, function(items) {
          console.log('Admob Apps: ' + items['admob_apps']);
          self.filterAdmobApps(items['admob_apps']);
        });   
      }
    });
    self.getXsrf();
  };
};