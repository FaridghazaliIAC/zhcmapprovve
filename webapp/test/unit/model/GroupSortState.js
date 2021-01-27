/*global QUnit*/

sap.ui.define([
	"hcm/capr/ZHCMApprove/model/GroupSortState",
	"sap/ui/model/json/JSONModel"
], function (GroupSortState, JSONModel) {
	"use strict";

	QUnit.module("GroupSortState - grouping and sorting", {
		beforeEach: function () {
			this.oModel = new JSONModel({});
			// System under test
			this.oGroupSortState = new GroupSortState(this.oModel, function() {});
		}
	});

	QUnit.test("Should always return a sorter when sorting", function (assert) {
		// Act + Assert
		assert.strictEqual(this.oGroupSortState.sort("Total").length, 1, "The sorting by Total returned a sorter");
		assert.strictEqual(this.oGroupSortState.sort("Claimno").length, 1, "The sorting by Claimno returned a sorter");
	});

	QUnit.test("Should return a grouper when grouping", function (assert) {
		// Act + Assert
		assert.strictEqual(this.oGroupSortState.group("Total").length, 1, "The group by Total returned a sorter");
		assert.strictEqual(this.oGroupSortState.group("None").length, 0, "The sorting by None returned no sorter");
	});


	QUnit.test("Should set the sorting to Total if the user groupes by Total", function (assert) {
		// Act + Assert
		this.oGroupSortState.group("Total");
		assert.strictEqual(this.oModel.getProperty("/sortBy"), "Total", "The sorting is the same as the grouping");
	});

	QUnit.test("Should set the grouping to None if the user sorts by Claimno and there was a grouping before", function (assert) {
		// Arrange
		this.oModel.setProperty("/groupBy", "Total");

		this.oGroupSortState.sort("Claimno");

		// Assert
		assert.strictEqual(this.oModel.getProperty("/groupBy"), "None", "The grouping got reset");
	});
});