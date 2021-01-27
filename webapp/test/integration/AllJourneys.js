/*global QUnit*/

jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

// We cannot provide stable mock data out of the template.
// If you introduce mock data, by adding .json files in your webapp/localService/mockdata folder you have to provide the following minimum data:
// * At least 3 ClaimSet in the list
// * All 3 ClaimSet have at least one To_Items

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
		"hcm/capr/ZHCMApprove/test/integration/MasterJourney",
		"hcm/capr/ZHCMApprove/test/integration/NavigationJourney",
		"hcm/capr/ZHCMApprove/test/integration/NotFoundJourney",
		"hcm/capr/ZHCMApprove/test/integration/BusyJourney",
		"hcm/capr/ZHCMApprove/test/integration/FLPIntegrationJourney"
	], function () {
		QUnit.start();
	});
});