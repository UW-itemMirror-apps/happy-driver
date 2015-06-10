'use strict';

/**
 * @ngdoc service
 * @name itemMirrorAngularDemoApp.itemMirror
 * @description
 * # itemMirror
 *
 * The service that handles all of the data when it comes to the
 * itemMirror object. This data can then be accessed by any
 * controller and used to display the data in a variety of ways. It
 * also wraps the asynchronous methods in promises for better
 * compatability with Angular and more overall flexibility.
 */
angular.module('itemMirrorAngularDemoApp')
  .factory('itemMirror', ['dropboxAuth', '$q', function (dropboxAuth, $q) {
    // This variable represents the current itemMirror that the
    // service will display data for. To keep things simple, we're
    // just going to handle dealing with one mirror at a time rather
    // than multiple mirrors. This will be initially set to the root
    // mirror.
    var mirror;

    // This array is used to keep track of all created mirrors,
    // initially consisting of just the root mirror. This allows us to
    // lookup mirrors that have been previously constructed and set
    // the mirror rather than constructing a completely new object
    // each time. Very useful for navigation.
    var mirrors;

    // This variable is an array of wrappers that can be used for data
    // binding associations. For two-way data-binding, a get and set
    // function needs to be defined using the appropriate
    // variables. For one way, you can just set a property
    var associations;

    //an object of mirrorAndAssoc, with the same order as mirrors
    //key is guid of the association of the mirror, value is mirrorAndAssoc
    //for root mirror, key is "root"
    //mirrorAndAssoc is an array of two element: mirror and associations
    var mirrorsAndAssocs;
    // An object to track whether the mirror of an association is ready
    // Does not contain the root mirror
    // key is the guid, value is true or false
    var isCurMirrorReady;

    // This is the association wrapping function. In order to allow data
    // binding for custom namespace attributes they must be manually inserted
    // here. For writable attributes a getter / setter must be defined.
    //
    // TODO: Create an injection function that will add to the wrappers so
    // that they can be defined outside of this file, allowing a separation of
    // core item mirror attributes and namespace attributes.
    function assocWrapper(guid) {

      var result = mirror.getAssociationNamespaceAttribute('tags', guid, 'im-angular-demo');
      var tags = result ? JSON.parse(result) : {};
      function saveTags() {
        mirror.setAssociationNamespaceAttribute('tags', JSON.stringify(tags), guid, 'im-angular-demo');
      }

      return {
        guid: guid,
        get displayText(){ return mirror.getAssociationDisplayText(guid); },
        set displayText(txt){ mirror.setAssociationDisplayText(guid, txt); },
        localItem: mirror.getAssociationLocalItem(guid),
        associatedItem: mirror.getAssociationAssociatedItem(guid),
        isGrouping: mirror.isAssociationAssociatedItemGrouping(guid),
        isPhantom: mirror.isAssociationPhantom(guid),

        //namespace attribute of date
        get yearVal(){ return mirror.getAssociationNamespaceAttribute('yearVal', guid, 'im-angular-demo'); },
        set yearVal(myYear){ mirror.setAssociationNamespaceAttribute('yearVal', myYear, guid, 'im-angular-demo'); },  

        get monthVal(){ return mirror.getAssociationNamespaceAttribute('monthVal', guid, 'im-angular-demo'); },
        set monthVal(myMonth){ mirror.setAssociationNamespaceAttribute('monthVal', myMonth, guid, 'im-angular-demo'); },  

        // These functions are all dealing with the private variable tags. This gives us a way to add,
        // delete, and list tags with an attribute. Internally these are represented as JSON and then these
        // methods are given to the associations to allow for easy manipulation as a directive.
        addTag: function(tag) {
          tags[tag] = true;
          saveTags();
        },

        deleteTag: function(tag) {
          delete tags[tag];
          saveTags();
        },

        listTags: function() {
          return Object.keys(tags);
        }
      };
    }

    // This function is extremely important to call after any major
    // change to the mirror variable. If the mirror switches to a new
    // mirror or a previous mirror, this must be called or Angular
    // won't be able to load any of the associations. This also needs
    // to be called during any type of sync operation when
    // associations can be created or deleted in bulk
    function updateAssociations() {
      console.log('updating associations');
      associations = mirror.listAssociations().map(function(guid) {
        return assocWrapper(guid);
      });
    }

    // Used to construct the very first ItemMirror object in the root
    // of the dropbox. In the future, this should be extended to use
    // FolderSelect, so that we can instead choose a different 'root'
    // itemMirror, or use a different set of drivers
    function constructRootMirror(dropboxClient) {
      var dropboxXooMLUtility;
      var dropboxItemUtility;
      var mirrorSyncUtility;
      var rootGroupingItemURI = '/happy-driver';

      dropboxXooMLUtility = {
        fragmentURI: '/XooML2.xml',
        driverURI: 'DropboxXooMLUtility',
        dropboxClient: dropboxClient
      };
      dropboxItemUtility = {
        driverURI: 'DropboxItemUtility',
        dropboxClient: dropboxClient
      };
      mirrorSyncUtility = {
        utilityURI: 'MirrorSyncUtility'
      };

      var options = {
        groupingItemURI: rootGroupingItemURI,
        xooMLDriver: dropboxXooMLUtility,
        itemDriver: dropboxItemUtility,
        syncDriver: mirrorSyncUtility
      };

      return construct(options);
    }

    function construct(options) {
      var deferred = $q.defer();

      new ItemMirror(options, function(error, IM) {
        if (error) { deferred.reject(error); }
        else { deferred.resolve(IM); }
      });

      return deferred.promise;
    }

    // Creates a new itemMirror, and then sets the current mirror to
    // the newly created mirror. Additionally updates the
    // associations array to reflect the associations found in the
    // new mirror.
    //
    // Note that this doesn't check if a mirror has
    // already been created, that should be done before calling this
    // function to keep things efficient.
    function createChild(guid) {
      var deferred = $q.defer();
      mirror.createItemMirrorForAssociatedGroupingItem(guid, function(error, newMirror) {
        console.log(error);
        if (error) { deferred.reject(error); }
        else {
          mirrors.push(newMirror);
          mirror = newMirror;
          updateAssociations();
          deferred.resolve();
        }
      });

      return deferred.promise;
    }

    //change from updateAssociations
    //Get associations of a newMirror without override the variable associations and mirror
    function getNextAssociations(newMirror){
      var nextAssociations;
      nextAssociations = newMirror.listAssociations().map(function(guid) {
        return assocWrapperWithMirror(guid, newMirror);
      });
      return nextAssociations;
    }

    //Update associations of certain mirror
    function updateAssociationsWithMirror(keyValue) {
      var curMirror = mirrorsAndAssocs[keyValue][0];
      var newAssociations = getNextAssociations(curMirror);
      mirrorsAndAssocs[keyValue][1] = newAssociations;
    }

    //Pass a mirror for assicWrapper, so that the return value is mirror specific
    function assocWrapperWithMirror(guid, myMirror) {
      var result = myMirror.getAssociationNamespaceAttribute('tags', guid, 'im-angular-demo');
      var tags = result ? JSON.parse(result) : {};
      function saveTags() {
        myMirror.setAssociationNamespaceAttribute('tags', JSON.stringify(tags), guid, 'im-angular-demo');
      }

      return {
        guid: guid,
        get displayText(){ return myMirror.getAssociationDisplayText(guid); },
        set displayText(txt){ myMirror.setAssociationDisplayText(guid, txt); },
        localItem: myMirror.getAssociationLocalItem(guid),
        associatedItem: myMirror.getAssociationAssociatedItem(guid),
        isGrouping: myMirror.isAssociationAssociatedItemGrouping(guid),
        isPhantom: myMirror.isAssociationPhantom(guid),

        //namespace attribute of a ride
        //Whether is repeating ride or not
        get isRepeat(){ return myMirror.getAssociationNamespaceAttribute('isRepeat', guid, 'im-angular-demo'); },
        set isRepeat(isRept){ myMirror.setAssociationNamespaceAttribute('isRepeat', isRept, guid, 'im-angular-demo'); },  

        //start date
        get yearVal(){ return myMirror.getAssociationNamespaceAttribute('yearVal', guid, 'im-angular-demo'); },
        set yearVal(myYear){ myMirror.setAssociationNamespaceAttribute('yearVal', myYear, guid, 'im-angular-demo'); },  

        get monthVal(){ return myMirror.getAssociationNamespaceAttribute('monthVal', guid, 'im-angular-demo'); },
        set monthVal(myMonth){ myMirror.setAssociationNamespaceAttribute('monthVal', myMonth, guid, 'im-angular-demo'); },  

        get dayVal(){ return myMirror.getAssociationNamespaceAttribute('dayVal', guid, 'im-angular-demo'); },
        set dayVal(myDay){ myMirror.setAssociationNamespaceAttribute('dayVal', myDay, guid, 'im-angular-demo'); },  

        //End date
        get yearValEnd(){ return myMirror.getAssociationNamespaceAttribute('yearValEnd', guid, 'im-angular-demo'); },
        set yearValEnd(myYear){ myMirror.setAssociationNamespaceAttribute('yearValEnd', myYear, guid, 'im-angular-demo'); },  

        get monthValEnd(){ return myMirror.getAssociationNamespaceAttribute('monthValEnd', guid, 'im-angular-demo'); },
        set monthValEnd(myMonth){ myMirror.setAssociationNamespaceAttribute('monthValEnd', myMonth, guid, 'im-angular-demo'); },  

        get dayValEnd(){ return myMirror.getAssociationNamespaceAttribute('dayValEnd', guid, 'im-angular-demo'); },
        set dayValEnd(myDay){ myMirror.setAssociationNamespaceAttribute('dayValEnd', myDay, guid, 'im-angular-demo'); },  

        //Time
        get arrivalTime(){ return myMirror.getAssociationNamespaceAttribute('arrivalTime', guid, 'im-angular-demo'); },
        set arrivalTime(arrvTime){ myMirror.setAssociationNamespaceAttribute('arrivalTime', arrvTime, guid, 'im-angular-demo'); },  

        get destination(){ return myMirror.getAssociationNamespaceAttribute('destination', guid, 'im-angular-demo'); },
        set destination(dest){ myMirror.setAssociationNamespaceAttribute('destination', dest, guid, 'im-angular-demo'); },

        get passengerNum(){ return myMirror.getAssociationNamespaceAttribute('passengerNum', guid, 'im-angular-demo'); },
        set passengerNum(num){ myMirror.setAssociationNamespaceAttribute('passengerNum', num, guid, 'im-angular-demo'); },

        //passenger1
        get pickUpTime1(){ return myMirror.getAssociationNamespaceAttribute('pickUpTime1', guid, 'im-angular-demo'); },
        set pickUpTime1(time1){ myMirror.setAssociationNamespaceAttribute('pickUpTime1', time1, guid, 'im-angular-demo'); },  
        
        get passengerName1(){ return myMirror.getAssociationNamespaceAttribute('passengerName1', guid, 'im-angular-demo'); },
        set passengerName1(name1){ myMirror.setAssociationNamespaceAttribute('passengerName1', name1, guid, 'im-angular-demo'); },  

        get passengerAddr1(){ return myMirror.getAssociationNamespaceAttribute('passengerAddr1', guid, 'im-angular-demo'); },
        set passengerAddr1(addr1){ myMirror.setAssociationNamespaceAttribute('passengerAddr1', addr1, guid, 'im-angular-demo'); },  

        get passengerPhoneNo1(){ return myMirror.getAssociationNamespaceAttribute('passengerPhoneNo1', guid, 'im-angular-demo'); },
        set passengerPhoneNo1(phone1){ myMirror.setAssociationNamespaceAttribute('passengerPhoneNo1', phone1, guid, 'im-angular-demo'); },  

        //passenger2
        get pickUpTime2(){ return myMirror.getAssociationNamespaceAttribute('pickUpTime2', guid, 'im-angular-demo'); },
        set pickUpTime2(time2){ myMirror.setAssociationNamespaceAttribute('pickUpTime2', time2, guid, 'im-angular-demo'); },  
        
        get passengerName2(){ return myMirror.getAssociationNamespaceAttribute('passengerName2', guid, 'im-angular-demo'); },
        set passengerName2(name2){ myMirror.setAssociationNamespaceAttribute('passengerName2', name2, guid, 'im-angular-demo'); },  

        get passengerAddr2(){ return myMirror.getAssociationNamespaceAttribute('passengerAddr2', guid, 'im-angular-demo'); },
        set passengerAddr2(addr2){ myMirror.setAssociationNamespaceAttribute('passengerAddr2', addr2, guid, 'im-angular-demo'); },  

        get passengerPhoneNo2(){ return myMirror.getAssociationNamespaceAttribute('passengerPhoneNo2', guid, 'im-angular-demo'); },
        set passengerPhoneNo2(phone2){ myMirror.setAssociationNamespaceAttribute('passengerPhoneNo2', phone2, guid, 'im-angular-demo'); },  

        //passenger3
        get pickUpTime3(){ return myMirror.getAssociationNamespaceAttribute('pickUpTime3', guid, 'im-angular-demo'); },
        set pickUpTime3(time3){ myMirror.setAssociationNamespaceAttribute('pickUpTime3', time3, guid, 'im-angular-demo'); },  
        
        get passengerName3(){ return myMirror.getAssociationNamespaceAttribute('passengerName3', guid, 'im-angular-demo'); },
        set passengerName3(name3){ myMirror.setAssociationNamespaceAttribute('passengerName3', name3, guid, 'im-angular-demo'); },  

        get passengerAddr3(){ return myMirror.getAssociationNamespaceAttribute('passengerAddr3', guid, 'im-angular-demo'); },
        set passengerAddr3(addr3){ myMirror.setAssociationNamespaceAttribute('passengerAddr3', addr3, guid, 'im-angular-demo'); },  

        get passengerPhoneNo3(){ return myMirror.getAssociationNamespaceAttribute('passengerPhoneNo3', guid, 'im-angular-demo'); },
        set passengerPhoneNo3(phone3){ myMirror.setAssociationNamespaceAttribute('passengerPhoneNo3', phone3, guid, 'im-angular-demo'); },  

        //passenger4
        get pickUpTime4(){ return myMirror.getAssociationNamespaceAttribute('pickUpTime4', guid, 'im-angular-demo'); },
        set pickUpTime4(time4){ myMirror.setAssociationNamespaceAttribute('pickUpTime4', time4, guid, 'im-angular-demo'); },  
        
        get passengerName4(){ return myMirror.getAssociationNamespaceAttribute('passengerName4', guid, 'im-angular-demo'); },
        set passengerName4(name4){ myMirror.setAssociationNamespaceAttribute('passengerName4', name4, guid, 'im-angular-demo'); },  

        get passengerAddr4(){ return myMirror.getAssociationNamespaceAttribute('passengerAddr4', guid, 'im-angular-demo'); },
        set passengerAddr4(addr4){ myMirror.setAssociationNamespaceAttribute('passengerAddr4', addr4, guid, 'im-angular-demo'); },  

        get passengerPhoneNo4(){ return myMirror.getAssociationNamespaceAttribute('passengerPhoneNo4', guid, 'im-angular-demo'); },
        set passengerPhoneNo4(phone4){ myMirror.setAssociationNamespaceAttribute('passengerPhoneNo4', phone4, guid, 'im-angular-demo'); },  

        get hasPassenger4(){ return myMirror.getAssociationNamespaceAttribute('hasPassenger4', guid, 'im-angular-demo'); },
        set hasPassenger4(hasPass4){ myMirror.setAssociationNamespaceAttribute('hasPassenger4', hasPass4, guid, 'im-angular-demo'); }, 

        //passenger5
        get pickUpTime5(){ return myMirror.getAssociationNamespaceAttribute('pickUpTime5', guid, 'im-angular-demo'); },
        set pickUpTime5(time5){ myMirror.setAssociationNamespaceAttribute('pickUpTime5', time5, guid, 'im-angular-demo'); },  
        
        get passengerName5(){ return myMirror.getAssociationNamespaceAttribute('passengerName5', guid, 'im-angular-demo'); },
        set passengerName5(name5){ myMirror.setAssociationNamespaceAttribute('passengerName5', name5, guid, 'im-angular-demo'); },  

        get passengerAddr5(){ return myMirror.getAssociationNamespaceAttribute('passengerAddr5', guid, 'im-angular-demo'); },
        set passengerAddr5(addr5){ myMirror.setAssociationNamespaceAttribute('passengerAddr5', addr5, guid, 'im-angular-demo'); },  

        get passengerPhoneNo5(){ return myMirror.getAssociationNamespaceAttribute('passengerPhoneNo5', guid, 'im-angular-demo'); },
        set passengerPhoneNo5(phone5){ myMirror.setAssociationNamespaceAttribute('passengerPhoneNo5', phone5, guid, 'im-angular-demo'); }, 

        get hasPassenger5(){ return myMirror.getAssociationNamespaceAttribute('hasPassenger5', guid, 'im-angular-demo'); },
        set hasPassenger5(hasPass5){ myMirror.setAssociationNamespaceAttribute('hasPassenger5', hasPass5, guid, 'im-angular-demo'); }, 

        //passenger6
        get pickUpTime6(){ return myMirror.getAssociationNamespaceAttribute('pickUpTime6', guid, 'im-angular-demo'); },
        set pickUpTime6(time6){ myMirror.setAssociationNamespaceAttribute('pickUpTime6', time6, guid, 'im-angular-demo'); },  
        
        get passengerName6(){ return myMirror.getAssociationNamespaceAttribute('passengerName6', guid, 'im-angular-demo'); },
        set passengerName6(name6){ myMirror.setAssociationNamespaceAttribute('passengerName6', name4, guid, 'im-angular-demo'); },  

        get passengerAddr6(){ return myMirror.getAssociationNamespaceAttribute('passengerAddr6', guid, 'im-angular-demo'); },
        set passengerAddr6(addr6){ myMirror.setAssociationNamespaceAttribute('passengerAddr6', addr6, guid, 'im-angular-demo'); },  

        get passengerPhoneNo6(){ return myMirror.getAssociationNamespaceAttribute('passengerPhoneNo6', guid, 'im-angular-demo'); },
        set passengerPhoneNo6(phone6){ myMirror.setAssociationNamespaceAttribute('passengerPhoneNo6', phone6, guid, 'im-angular-demo'); }, 

        get hasPassenger6(){ return myMirror.getAssociationNamespaceAttribute('hasPassenger6', guid, 'im-angular-demo'); },
        set hasPassenger6(hasPass6){ myMirror.setAssociationNamespaceAttribute('hasPassenger6', hasPass6, guid, 'im-angular-demo'); }, 



        // These functions are all dealing with the private variable tags. This gives us a way to add,
        // delete, and list tags with an attribute. Internally these are represented as JSON and then these
        // methods are given to the associations to allow for easy manipulation as a directive.
        addTag: function(tag) {
          tags[tag] = true;
          saveTags();
        },

        deleteTag: function(tag) {
          delete tags[tag];
          saveTags();
        },

        listTags: function() {
          return Object.keys(tags);
        }
      };
    }

    //create new mirror and new associations, stored in mirrorsAndAssocs
    //does not update the variable mirror and associations
    //the new mirror is for association of the currentMirror
    function createChildWithoutUpdate(currentMirror, guid) {
      var deferred = $q.defer();
      currentMirror.createItemMirrorForAssociatedGroupingItem(guid, function(error, newMirror) {
        if (error) {
          console.log(error);
          deferred.reject(error);
        }
        else {
          var newAssociations = getNextAssociations(newMirror);
          var mirrorAndAssoc = [newMirror];
          mirrorAndAssoc.push(newAssociations);
          mirrorsAndAssocs[guid] = mirrorAndAssoc;
          isCurMirrorReady[guid] = true;
          deferred.resolve();
        }
      });

      return deferred.promise;
    }

    //save the attachedInfo to namespace attributes of the targetObj (type 0)
    //Or save the namespace attributes of attachedInfo to the targetObj (type 1)
    //Attach all information of the attachedInfo to targetObj
    //Two type of set attachedInfo: 0: from ride to Assoc; 1: from Assoc to ride (Used when moving a ride)
    //keyValue: used to find mirror of association
    function setAttachedInfoToAttribute(targetObj, attachedInfo, type, keyValue) {
      //Type 0: from ride to Assoc
      var currentMirror = mirrorsAndAssocs[keyValue][0];
      if (type === 0 ) {
        if (targetObj.isGrouping) {
          targetObj.yearVal = attachedInfo.yearVal;
          targetObj.monthVal = attachedInfo.monthVal;
          return;
        }
        var x;
        for (x in attachedInfo) {
          currentMirror.setAssociationNamespaceAttribute(x, attachedInfo[x], targetObj.guid, 'im-angular-demo');
        }
        if (!targetObj.isGrouping) {
          targetObj.passengerNum = 0;
          if (attachedInfo.passengerName1) {
            targetObj.passengerNum += 1;
          }
          if (attachedInfo.passengerName2) {
            targetObj.passengerNum += 1;
          }
          if (attachedInfo.passengerName3) {
            targetObj.passengerNum += 1;
          }
          if (attachedInfo.passengerName4) {
            targetObj.passengerNum += 1;
          }
          if (attachedInfo.passengerName5) {
            targetObj.passengerNum += 1;
          }
          if (attachedInfo.passengerName6) {
            targetObj.passengerNum += 1;
          }
        }
      }
      //Type 1: from Assoc to ride
      else {
        var listOfNamespace = currentMirror.listAssociationNamespaceAttributes(attachedInfo.guid, 'im-angular-demo');
        var len = listOfNamespace.length;
        for (var i = 0; i < len; i++) {
          var x = listOfNamespace[i];
          targetObj[x] = currentMirror.getAssociationNamespaceAttribute(x, attachedInfo.guid, 'im-angular-demo');
        }
      }
    }

    return {
      save: function() {
        var deferred = $q.defer();

        mirror.save(function(error) {
          if (error) { deferred.reject(error); }
          else {
            updateAssociations();
            deferred.resolve();
          }
        });

        return deferred.promise;
      },

      createAssociation: function(options) {
        var deferred = $q.defer();

        mirror.createAssociation(options, function(error, guid) {
          if (error) {
            deferred.reject(error);
            console.log(error);
          }
          else {
            // Add a new wrapped association
            associations.push( assocWrapper(guid) );
            deferred.resolve();
          }
        });

        return deferred.promise;
      },

      deleteAssociation: function(guid) {
        console.log('Delete Association Called');
        console.log('GUID: ' + guid);
        var deferred = $q.defer();

        mirror.deleteAssociation(guid, function(error) {
          if (error) {
            deferred.reject(error);
            console.log(error);
          }
          else {
            var guids = associations.map(function(assoc) { return assoc.guid; });
            var delIdx = guids.indexOf(guid);
            // Removes the deleted association wrapper
            associations.splice(delIdx, 1);
            updateAssociations();
            deferred.resolve();
          }
        });

        return deferred.promise;
      },

      // Returns the association wrappers for use within a
      // controller. Note that we use a getter, because the
      // associations aren't a property, they're part of a closure,
      // and so a function is needed for retrieval
      get associations() { return associations; },

      get displayName() { return mirror.getDisplayName(); },
      set displayName(name) { mirror.setDisplayName(name); },

      get itemDescribed() { return mirror.getURIforItemDescribed(); },

      // A promise that completes after dropbox has authenticated, and
      // the initial root itemMirror has been created. This should
      // only be called once, preferably in some sort of start up area
      initialize: dropboxAuth.connectDropbox().
        then(constructRootMirror).
        then(function(rootMirror) {
          mirror = rootMirror;
          mirrors = [rootMirror];

          updateAssociations();
          //to initialize associationsArr
          mirrorsAndAssocs = {};
          mirrorsAndAssocs['root'] = [mirror,associations];
          isCurMirrorReady = {};
        }),

      //create mirror for an association of current mirror
      //the association must be a grouping association
      createSubMirror: function(currentMirror, guidOfAssoc){
        var deferred = $q.defer();
        createChildWithoutUpdate(currentMirror, guidOfAssoc).then(function() {
            deferred.resolve();
            }, function(error) {
            deferred.reject(error);
            });
        return deferred.promise;
      },

      getMirrorsAndAssocs: function(){
        return mirrorsAndAssocs;
      },

      getIsCurrentMirrorReady: function() {
        return isCurMirrorReady;
      },

      //Change from createAssociation function
      //pass a keyValue for certain mirror to be used to create the assoc 
      //the keyValue for root mirror is "root", and is guid for other mirrors
      createAssociationWithMirror: function(keyValue, attachedInfo, options) {
        var deferred = $q.defer();

        var curMirror = mirrorsAndAssocs[keyValue][0];
        curMirror.createAssociation(options, function(error, guid) {
          if (error) {
            console.log("error when creating new assoc: " + error);
            deferred.reject(error);
          }
          else {
            // Add a new wrapped association
            var newAssoc = assocWrapperWithMirror(guid, curMirror);
            //write attached info to namespace attributes of the assoc
            setAttachedInfoToAttribute(newAssoc, attachedInfo, 0, keyValue);
            mirrorsAndAssocs[keyValue][1].push( newAssoc );
            console.log("new Assoc created");
            deferred.resolve(newAssoc);
          }
        });

        return deferred.promise;
      },

      //Save a certain mirror and its associations
      saveWithMirror: function(keyValue) {
        var deferred = $q.defer();
        var curMirror = mirrorsAndAssocs[keyValue][0];
        curMirror.save(function(error) {
          if (error) { deferred.reject(error); }
          else {
            updateAssociationsWithMirror(keyValue);
            deferred.resolve();
          }
        });

        return deferred.promise;
      },

      //Delete an association of a mirror
      //guid: guid of the associaiton mean to be deleted
      //keyValue: used to find the target mirror
      deleteAssocWithMirror: function(keyValue, guid) {
        console.log('Delete Association Called');
        console.log('GUID: ' + guid);
        var deferred = $q.defer();
        var curMirror = mirrorsAndAssocs[keyValue][0];
        var curAssociations = mirrorsAndAssocs[keyValue][1];
        
        curMirror.deleteAssociation(guid, function(error) {
          if (error) {
            deferred.reject(error);
            console.log("assoc delete error: " + error);
          }
          else {
            var guids = curAssociations.map(function(assoc) { return assoc.guid; });
            var delIdx = guids.indexOf(guid);
            // Removes the deleted association wrapper
            curAssociations.splice(delIdx, 1);
            curMirror.save(function(error) {
              if (error) { deferred.reject(error); }
              else {
                updateAssociationsWithMirror(keyValue);
                deferred.resolve();
              }
            });
          }
        });

        return deferred.promise;
      },

      //Copy namespace attributes of the current association to target object (type 1)
      //Or copy information of the current object to target associaiton (type 0)
      copyAttachedInfoToTargetVar: function(target, current, type, keyValue) {
        setAttachedInfoToAttribute(target, current, type, keyValue);
      },
    };
  }]);
