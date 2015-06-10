'use strict';

/**
 * @ngdoc function
 * @name itemMirrorAngularDemoApp.controller:ExplorerCtrl
 * @description
 * # ExplorerCtrl
 * Controller of the itemMirrorAngularDemoApp
 */
angular.module('itemMirrorAngularDemoApp')
  .controller('ExplorerCtrl', function ($scope, itemMirror) {
  	// starts everything up after dropbox loads
  	var init = itemMirror.initialize;
  	init.then(function() {
      $scope.mirror = itemMirror;
      $scope.associations = itemMirror.associations;
      $scope.selectedAssoc = null;

      //this object stores mirrors and its associations, key is the guid of assoc of the mirror
      //for root mirror and associations, key is "root"
      $scope.mirrorsAndAssocs = itemMirror.getMirrorsAndAssocs();

      //this object used to track whether the mirror of a grouping association is ready
      //key is the guid, value is true or false
      //does NOT contain the root mirror
      $scope.isCurMirrorReady = itemMirror.getIsCurrentMirrorReady();
      //create and initiate $scope.rideInfo, for the purpose of showing current date in creating form by default
      initRide(); 

      var longMonth = rangeArr(1, 31);
      var shortMonth = rangeArr(1, 30);
      var feb = rangeArr(1, 29);
      $scope.daysForMonth = {
        '01': longMonth,
        '02': feb,
        '03': longMonth,
        '04': shortMonth,
        '05': longMonth,
        '06': shortMonth,
        '07': longMonth,
        '08': longMonth,
        '09': shortMonth,
        '10': longMonth,
        '11': shortMonth,
        '12': longMonth,
      };
      $scope.tempDate = {}; //Used to track whether the date of a ride is changed when editing
      $scope.loading = {isLoading: null, info: null}; //Used to show when to display loading spinner

      //create mirrors for all of the grouping associations of root mirror
      getSubMirrors("root");

      //Used to generate a string array of increasing numbers
      //In order to sort date correctly, add 0 to one digit int and convert int to string
      function rangeArr(start, end) {
        var len = end - start + 1;
        var arr = [start];
        var arrStr = [start < 10? '0'+start : start.toString()];
        for (var i = 1; i < len; ++i) {
          arr[i] = arr[i-1] + 1;
          arrStr[i] = arr[i] < 10? '0'+arr[i] : arr[i].toString();
        }
        return arrStr;
      }

      function initRide() {
        $scope.rideInfo = {};
        $scope.rideInfo.isRepeat = 'non-repeated';
        var d = new Date();
        $scope.rideInfo.monthVal = getStrDate(d, 1);
        $scope.rideInfo.dayVal = getStrDate(d, 0);
        $scope.rideInfo.yearVal = (d.getFullYear()).toString();
        $scope.rideInfo.monthValEnd = $scope.rideInfo.monthVal;
        $scope.rideInfo.dayValEnd = $scope.rideInfo.dayVal;
        $scope.rideInfo.yearValEnd = $scope.rideInfo.yearVal;
        function getStrDate(d, type) {
          if (type === 0) {
            var dateInt = d.getDate();
          }
          else {
            var dateInt = d.getMonth() + 1;
          }
          return dateInt < 10? '0'+dateInt : dateInt.toString();
        }
      }

      //get sub mirrors for all of the grouping associations of current mirror
      //parameter keyvalue is the key of the current mirror and associations in the mirrorsAndAssocs object
      //when the root mirror is current mirror, keyvalue is "root"
      //when the current mirror is mirror of an assoc, the key is assoc.guid
      function getSubMirrors(keyvalue) {
        var currentMirror = $scope.mirrorsAndAssocs[keyvalue][0];
        var curAssocs = $scope.mirrorsAndAssocs[keyvalue][1];
        var len = curAssocs.length;
        for(var i = 0; i < len; i++) {
          var currentAssoc = curAssocs[i];
          if (!currentAssoc.isGrouping) {
            continue;
          }
          else {
            //the mirror has already exist
            if ($scope.mirrorsAndAssocs[currentAssoc.guid]) {
              console.log('The mirror has already exist');
              continue;
            }
            else {
              console.log('Creating sub mirror');
              itemMirror.createSubMirror(currentMirror, currentAssoc.guid)
              .then(mirrorsScopeUpdate);
            }
          }
        }
      }

      // Get sub mirror for a certain association of current mirror
      // parameter keyvalue is the key of the current mirror and associations in the mirrorsAndAssocs object
      // parameter currentAssoc is the association which need to create sub mirror for
      // will only be used for sub folders, so the keyvalue would be guid of current mirror
      function getSubMirror(keyvalue, currentAssoc) {
        var currentMirror = $scope.mirrorsAndAssocs[keyvalue][0];
        if (!currentAssoc.isGrouping) {
          return;
        }
        else {
          //the mirror has already exist
          if ($scope.mirrorsAndAssocs[currentAssoc.guid]) {
            console.log('The mirror has already exist');
            return;
          }
          else {
            console.log('Creating sub mirror');
            itemMirror.createSubMirror(currentMirror, currentAssoc.guid)
            .then(mirrorsScopeUpdate);
          }
        }
      }

      //Update mirrorsAndAssocs
      function mirrorsScopeUpdate() {
        $scope.mirrorsAndAssocs = itemMirror.getMirrorsAndAssocs();
        $scope.isCurMirrorReady = itemMirror.getIsCurrentMirrorReady();
      }

      //Use year and month to find the folder with the same value of year and month
      //In this app, folders are all in the first level, which is in the "associations"
      //return guid of the folder assoc
      function findAssocByDate(yearVal, monthVal) {
        var len = $scope.associations.length;
        for (var i = 0; i < len; ++i) {
          var assoc = $scope.associations[i];
          if (assoc.yearVal === yearVal) {
            if (assoc.monthVal === monthVal) {
              return assoc.guid;
            }
          }
        }
        return false;
      }

      //Create folder of the month, construct a mirror for the folder, and then create a ride phantom for the new folder
      //Only called when a user is trying to create a ride with a date that the target folder is not existed in Dropbox
      function createRideFolder(rideInfo) {
        var displayMonth = {
          '01': 'January',
          '02': 'February',
          '03': 'March',
          '04': 'April',
          '05': 'May',
          '06': 'June',
          '07': 'July',
          '08': 'August',
          '09': 'September',
          '10': 'October',
          '11': 'November',
          '12': 'December',
        };
        $scope.folderRequest.displayText = displayMonth[rideInfo.monthVal] + '-' + rideInfo.yearVal;
        $scope.folderRequest.localItem = $scope.folderRequest.displayText;
        $scope.folderRequest.isGroupingItem = true;
        var keyValue = "root";
        itemMirror.createAssociationWithMirror(keyValue, rideInfo, $scope.folderRequest).
        then( function(newAssoc) {
          switchToAssocEditor();
          itemMirror.saveWithMirror(keyValue).
          then(function(){
            mirrorsScopeUpdate();
            //construct mirror for the new Assoc
            var currentMirror = $scope.mirrorsAndAssocs["root"][0];
            itemMirror.createSubMirror(currentMirror, newAssoc.guid)
              .then(function(){
                createRide(newAssoc.guid, rideInfo, $scope.phantomRequest);
              });
            });
          resetFolderRequest();
        });
      }

      //create phantom for ride
      function createRide(keyValue, rideInfo, phantomRequest) {
        itemMirror.createAssociationWithMirror(keyValue, rideInfo, phantomRequest).
        then(function() {
          switchToAssocEditor();
          itemMirror.saveWithMirror(keyValue).
          then(function() {
            mirrorsScopeUpdate();
            $scope.loading = {};
          });
          resetPhantomRequest();
          initRide();
        });
      }

      //Copy all of the namespace attributes of currentAssoc (including namespace added by other apps) to $scope.rideInfo
      //Called before moving a ride to another folder
      function copyRideInfo(currentAssoc, currentKeyValue) {
        itemMirror.copyAttachedInfoToTargetVar($scope.rideInfo, currentAssoc, 1, currentKeyValue);
      }

      //Count the number of passengers of a ride
      function countPassengers(currentAssoc) {
        var passNum = 0;
        if (currentAssoc.passengerName1 && currentAssoc.passengerName1 != 'null') {
          passNum += 1;
        }
        if (currentAssoc.passengerName2 && currentAssoc.passengerName2 != 'null') {
          passNum += 1;
        }
        if (currentAssoc.passengerName3 && currentAssoc.passengerName3 != 'null') {
          passNum += 1;
        }
        if (currentAssoc.passengerName4 && currentAssoc.passengerName4 != 'null') {
          passNum += 1;
        } else {
          currentAssoc.hasPassenger4 = false;
        }
        if (currentAssoc.passengerName5 && currentAssoc.passengerName5 != 'null') {
          passNum += 1;
        } else {
          currentAssoc.hasPassenger5 = false;
        }
        if (currentAssoc.passengerName6 && currentAssoc.passengerName6 != 'null') {
          currentAssoc.passengerNum += 1;
        } else {
          currentAssoc.hasPassenger6 = false;
        }
        currentAssoc.passengerNum = passNum;
      }

      // This needs to be called after the service updates the associations.
      // Angular doesn't watch the scope of the service's associations, so any
      // updates don't get propogated to the front end.
      function assocScopeUpdate() {
        $scope.associations = itemMirror.associations;
        $scope.selectedAssoc = null;
       }

      $scope.save = function() {
        itemMirror.save().
        then(assocScopeUpdate);
      };       

      // Only one association is ever selected at a time. It has the boolean
      // selected property, to allow for unique styling
      // keep ride info showing when selecting another ride
      $scope.select = function(assoc) {
        $scope.selectedAssoc = assoc;
        $scope.tempDate.yearVal = $scope.selectedAssoc.yearVal;
        $scope.tempDate.monthVal = $scope.selectedAssoc.monthVal;
        $scope.selectedAssoc.selected = true;
      };

      $scope.expand = function(assoc) {
        assoc.selected = true;
      }
      // reset the selected attribute of assoc to false
      $scope.unExpand = function(assoc) {
        assoc.selected = false;
        if ($scope.selectedAssoc === assoc) {
          $scope.selectedAssoc = null;
        }
      }

      // initiate and reset Phantom request
      function resetPhantomRequest() {
        $scope.phantomRequest.displayText = '';
        $scope.phantomRequest.itemURI = '';
        $scope.phantomRequest.localItemRequested = false;
      }

      $scope.phantomRequest = {};
      resetPhantomRequest();

      // initiate and reset Folder request
      function resetFolderRequest() {
        $scope.folderRequest.displayText = '';
        $scope.folderRequest.localItem = '';
        $scope.folderRequest.isGroupingItem = true;
      }

      $scope.folderRequest = {};
      resetFolderRequest();

      // default section for our editing panel
      function switchToAssocEditor() {
        $scope.editSection = 'assoc-editor';
      }

      switchToAssocEditor();

      $scope.createRidePhantom = function() {
        $scope.loading.isLoading = true;
        $scope.loading.loadInfo = "Saving...";
        $scope.phantomRequest.displayText = $scope.rideInfo.monthVal + '-' + $scope.rideInfo.dayVal + '-' + $scope.rideInfo.yearVal;
        $scope.phantomRequest.itemURI = $scope.rideInfo.dayVal;//not useful, anything would be fine
        //A ride must have year value and month value
        //Use the month and year to find target folder
        var keyValue = findAssocByDate($scope.rideInfo.yearVal, $scope.rideInfo.monthVal);
        //The target folder does not exist, create it
        //In this app, folder are all in the first level
        if (!keyValue) { 
          createRideFolder($scope.rideInfo);
        }
        else {
          createRide(keyValue, $scope.rideInfo, $scope.phantomRequest);
        }
      }

      $scope.saveEdit = function(currentAssoc) {
        $scope.loading.isLoading = true;
        $scope.loading.loadInfo = "Saving...";
        //Count passengerNum
        countPassengers(currentAssoc);
        //value of month and year did not change
        if (($scope.tempDate.yearVal === currentAssoc.yearVal) && ($scope.tempDate.monthVal === currentAssoc.monthVal)) {
          var keyValue = findAssocByDate(currentAssoc.yearVal, currentAssoc.monthVal);
          itemMirror.saveWithMirror(keyValue).
            then(function(){
              mirrorsScopeUpdate();
              $scope.selectedAssoc = null;
              $scope.loading = {};
            });
        }
        //value of month and year changed: Move ride
        else {
          var curKey = findAssocByDate($scope.tempDate.yearVal, $scope.tempDate.monthVal);
          var targetKey = findAssocByDate(currentAssoc.yearVal, currentAssoc.monthVal);
          //Save all of the namespace attributes (including namespace added by other apps) of the currentAssoc to $scope.ride
          copyRideInfo(currentAssoc, curKey);
          //create new phantom with rideInfo, then delete old phantom
          itemMirror.deleteAssocWithMirror(curKey, currentAssoc.guid).
          then(function(){
            mirrorsScopeUpdate();
            $scope.createRidePhantom();
            $scope.selectedAssoc = null;
          });
        }
      }

      $scope.cancelEdit = function() {
        $scope.selectedAssoc = null;
      }

      $scope.cancelCreate = function() {
        $scope.editSection = null;
        initRide();
      }

      $scope.deleteRide = function(currentAssoc) {
        $scope.loading.isLoading = true;
        $scope.loading.loadInfo = "Deleting...";
        var keyValue = findAssocByDate(currentAssoc.yearVal, currentAssoc.monthVal);
        itemMirror.deleteAssocWithMirror(keyValue, currentAssoc.guid).
          then(function(){
            mirrorsScopeUpdate();
            $scope.selectedAssoc = null;
            $scope.loading = {};
          });
      }

      //Set one passenger's info to null 
      //when obj == 0, the object is $scope.rideInfo
      //when obj == 1, the object is $scope.selectedAssoc
      //num is the passenger number, could be from 1 to 6
      $scope.clearPassenger = function(obj, num) {
        if (obj === 0) {
          var objName = '$scope.rideInfo';
        }
        else {
          var objName = '$scope.selectedAssoc';
        }
        var pickUp = objName + '.pickUpTime' + num;
        var passName = objName + '.passengerName' + num;
        var passAddr = objName + '.passengerAddr' + num;
        var passPhone = objName + '.passengerPhoneNo' + num;
        eval(pickUp + "=" + null);
        eval(passName + "=" + null);
        eval(passAddr + "=" + null);
        eval(passPhone + "=" + null);
      }
    });
  });
