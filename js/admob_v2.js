var AdmobV2 = function (publisherId) {
  this.publisherId = publisherId;
  AdmobV2.appodealAppsUrl = APPODEAL_API_URL + "/admob_plugin/api/v1/apps_with_ad_units";

  AdmobV2.prototype.getAppodealApps = function () {
    var self = this
    $.get(AdmobV2.appodealAppsUrl, {account: self.publisherId})
      .done(function (data) {
        console.log(data.applications)
        if (data.applications && data.applications.length) {
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

  AdmobV2.prototype.syncInventory = function () {
    var self = this
    self.getAppodealApps();
  };
};