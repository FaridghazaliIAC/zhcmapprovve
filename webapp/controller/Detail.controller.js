sap.ui.define([
	"hcm/capr/ZHCMApprove/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"hcm/capr/ZHCMApprove/model/formatter",
	"sap/ui/core/Core",
	"sap/m/Dialog",
	"sap/m/DialogType",
	"sap/m/Button",
	"sap/m/ButtonType",
	"sap/m/Label",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/m/TextArea"
], function(BaseController, JSONModel, formatter, Core, Dialog, DialogType, Button, ButtonType, Label, MessageToast, MessageBox, TextArea) {
	"use strict";

	return BaseController.extend("hcm.capr.ZHCMApprove.controller.Detail", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function() {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading"),
				To_Items: []
			});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "detailView");
			this.oViewModel = oViewModel;
			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
			this.oDataModel = this.getOwnerComponent().getModel();
			this.changedStatusItems = [];
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		img: {},
		photoPopup: {},
		onShowAttach: function(oEvent) {
			var itemPath = oEvent.getParameter("listItem").getBindingContextPath();
			itemPath = "/ClaimItemSet('" + oEvent.getSource().getModel("detailView").getProperty(itemPath).ItemId + "')";
			// var itemPath = oEvent.getSource().getParent().getBindingContextPath();
			var that = this;
			this.getView().setBusy(true);
			this.oDataModel.read(itemPath + "/To_Attachments", {
				success: function(data) {
					var attachs = data.results;
					that.getView().setBusy(false);
					// get the index of the row for which the attachment button has been clicked
					if (attachs.length > 0) {
						that.photoPopup = new sap.ui.xmlfragment("hcm.capr.ZHCMApprove.fragments.convertPDFToUrl", that);
						that.getView().addDependent(that.photoPopup);
						var oControl = that.photoPopup.getAggregation("content")[0];
						oControl.setSource(that.formatter.convertPDFToUrl(atob(attachs[0].Content)));
						that.photoPopup.open();
					} else {
						MessageToast.show("No Attachment Found");
					}
				}
			});
		},
		handleClosePress: function(oEvent) {
			this.img = {};
			this.photoPopup.close();
			this.photoPopup.destroy();
		},
		onStatusChange: function(oEvent) {
			this.getView().byId("idSubmit").setEnabled(false);
			this.getView().byId("idSave").setEnabled(true);
		},
		onSubmit: function() {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var sPath = oElementBinding.getPath(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.Claimid;
			var that = this;
			MessageBox.confirm("Do you want to Submit for Approval, Claim will be locked", function(oVal) {
				if (oVal === "OK") {
					var header = that.getView().getModel("local").getProperty("/header");
					var payload = {
						Docstat: "1"
					};
					that.getView().setBusy(true);
					that.oDataModel.update("/ClaimSet('" + sObjectId + "')", payload, {
						success: function(data) {
							that.getView().setBusy(false);
							sap.m.MessageToast.show(that.oResource.getText("Success"));
							that.onRefreshClaim(header.Claimid);
						},
						error: function() {
							sap.m.MessageToast.show(that.oResource.getText("Error"));
						}
					});
				}
			});
			this.getView().byId("idSubmit").setEnabled(false);
			this.getView().byId("idSave").setEnabled(true);
		},

		onSave: function() {
			var that = this;
			var items = this.getView().getModel('detailView').getData().To_Items;
			// this.changedStatusItems = [];
			this.getView().setBusy(true);
			items.forEach(function(item) {
				that.getView().getModel().update("/ClaimItemSet('" + item.ItemId + "')", {
					"Status": item.Action === "R" ? "3" : "2",
					"Comments": item.Comments
				}, {
					success: function() {
						that.getView().setBusy(false);
						MessageToast.show("Save Sucessfully");
					},
					error: function() {
						MessageToast.show("Submition Failed");
						that.getView().setBusy(false);
						that.changedStatusItems = items;
					}
				});
			});
			this.getView().byId("idSubmit").setEnabled(true);
			this.getView().byId("idSave").setEnabled(false);
		},
		onListUpdateFinished: function(oEvent) {
			var sTitle,
				iTotalItems = oEvent.getParameter("total"),
				oViewModel = this.getModel("detailView");

			// only update the counter if the length is final
			if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
				if (iTotalItems) {
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
				} else {
					//Display 'Line Items' instead of 'Line items (0)'
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
				}
				oViewModel.setProperty("/lineItemListTitle", sTitle);
			}
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function(oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.getModel().metadataLoaded().then(function() {
				var sObjectPath = this.getModel().createKey("ClaimSet", {
					Claimid: sObjectId
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));
		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function(sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function() {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function() {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
			var that = this;
			this.getView().getModel().read(sObjectPath + "/To_Items", {
				success: function(data) {
					for (var i = 0; i < data.results.length; i++) {
						data.results[i].Action = data.results[i].Status === "3" ? "R" : "A";
					}
					that.oViewModel.setProperty("/To_Items", data.results);
				}
			});
		},

		_onBindingChange: function() {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.Claimid,
				sObjectName = oObject.Claimno,
				oViewModel = this.getModel("detailView");

			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},

		_onMetadataLoaded: function() {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView"),
				oLineItemTable = this.byId("lineItemsList"),
				iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);
			oViewModel.setProperty("/lineItemTableDelay", 0);

			oLineItemTable.attachEventOnce("updateFinished", function() {
				// Restore original busy indicator delay for line item table
				oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
			});

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		}

	});

});