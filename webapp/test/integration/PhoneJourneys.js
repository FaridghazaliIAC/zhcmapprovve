/*global QUnit*/

jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
	"sap/ui/test/Opa5",
	"hcm/capr/ZHCMApprove/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"hcm/capr/ZHCMApprove/test/integration/pages/App",
	"hcm/capr/ZHCMApprove/test/integration/pages/Browser",
	"hcm/capr/ZHCMApprove/test/integration/pages/Master",
	"hcm/capr/ZHCMApprove/test/integration/pages/Detail",
	"hcm/capr/ZHCMApprove/test/integration/pages/NotFound"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "hcm.capr.ZHCMApprove.view."
	});

	sap.ui.require([
		"hcm/capr/ZHCMApprove/test/integration/NavigationJourneyPhone",
		"hcm/capr/ZHCMApprove/test/integration/NotFoundJourneyPhone",
		"hcm/capr/ZHCMApprove/test/integration/BusyJourneyPhone"
	], function () {
		QUnit.start();
	});
});