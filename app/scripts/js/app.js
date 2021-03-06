'use strict';
angular.module('ngArchitectApp', []);

angular.module('ngArchitectApp').factory('BacklogItemsService', function($http) {
  var service;
  service = {
    'loadBacklogItems': function() {
      return $http.get('data/backlog-items.json');
    }
  };
  return service;
});

angular.module('ngArchitectApp').factory('Backlog', function($http, $q) {
  var constructor;
  constructor = function(uri) {
    var _this = this;
    this.uri = uri;
    this.load = function(config) {
      var deferred;
      deferred = $q.defer();
      $http.get(uri, config).success(function(items) {
        _this.items = items;
        return deferred.resolve(_this.items);
      }).error(function() {
        return deferred.reject();
      });
      return deferred.promise;
    };
    this.removeStory = function(story) {
      return _this.items = _.without(_this.items, story);
    };
    this.insertStory = function(story) {
      return _this.items.push(story);
    };
    return this;
  };
  return constructor;
});

angular.module('ngArchitectApp').factory('BacklogContext', function() {
  this.useCases = {
    'displayBacklogItems': function(backlog) {
      return backlog.displayItems();
    }
  };
  return this;
});

angular.module('ngArchitectApp').factory('PlanningContext', function() {
  this.useCases = {
    'moveStory': function(src, dest, story) {
      src.removeStory(story);
      return dest.insertStory(story);
    }
  };
  return this;
});

angular.module('ngArchitectApp').factory('PreviewStoryContext', function() {
  var _this = this;
  this.useCases = {
    'previewStory': function(previewer, story) {
      return previewer.preview(story);
    },
    'closeStory': function(previewer) {
      return previewer.close();
    }
  };
  return this;
});

angular.module('ngArchitectApp').controller('BacklogCtrl', function(BacklogContext, BacklogItemsService, EventAdapter, $scope, $http) {
  this.backlog = {
    displayItems: function() {
      return BacklogItemsService.loadBacklogItems().success(function(items) {
        return $scope.backlogItems = items;
      });
    }
  };
  BacklogContext.useCases.displayBacklogItems(this.backlog);
  $scope.storyClick = function(story) {
    return EventAdapter.broadcast('story.clicked', story);
  };
});

angular.module('ngArchitectApp').controller('PlanningCtrl', function(PlanningContext, Backlog, EventAdapter, $scope) {
  var _this = this;
  $scope.leftBacklog = new Backlog('data/backlog-items.json');
  $scope.rightBacklog = new Backlog('data/backlog-items.json');
  $scope.leftBacklog.load();
  $scope.rightBacklog.load();
  $scope.storyClick = function(story) {
    return EventAdapter.broadcast('story.clicked', story);
  };
  $scope.moveStoryToRightBacklog = function(story) {
    return PlanningContext.useCases.moveStory($scope.leftBacklog, $scope.rightBacklog, story);
  };
  $scope.moveStoryToLeftBacklog = function(story) {
    return PlanningContext.useCases.moveStory($scope.rightBacklog, $scope.leftBacklog, story);
  };
});

angular.module('ngArchitectApp').controller('PreviewStoryCtrl', function(PreviewStoryContext, EventAdapter, $scope) {
  var _this = this;
  this.previewer = {
    preview: function(story) {
      return $scope.story = story;
    },
    close: function() {
      return $scope.story = null;
    }
  };
  EventAdapter.on('previewStory.previewStory', function(story) {
    return PreviewStoryContext.useCases.previewStory(_this.previewer, story);
  });
  $scope.close = function() {
    return PreviewStoryContext.useCases.closeStory(_this.previewer);
  };
});

angular.module('ngArchitectApp').factory('EventAdapter', function(eventAdapterConfig) {
  var destinationToMediumMap, eventAdapter, eventListeners, mapDestinationToMedium, mapSourceToMedium, push, putMedium, sourceToMediumMap;
  push = function(key, value, map) {
    if (!(key in map)) {
      map[key] = [];
    }
    map[key].push(value);
    return map;
  };
  putMedium = function(key, medium, map) {
    return push(key, medium, map);
  };
  mapSourceToMedium = function(config) {
    var map;
    map = {};
    angular.forEach(config, function(sourceArray, medium) {
      return angular.forEach(sourceArray, function(source) {
        map = putMedium(source, medium, map);
      });
    });
    return map;
  };
  mapDestinationToMedium = function(config) {
    var map;
    map = {};
    angular.forEach(config, function(destinationArray, medium) {
      return angular.forEach(destinationArray, function(destination) {
        map = putMedium(destination, medium, map);
      });
    });
    return map;
  };
  eventListeners = {};
  destinationToMediumMap = mapDestinationToMedium(eventAdapterConfig.out);
  sourceToMediumMap = mapSourceToMedium(eventAdapterConfig['in']);
  eventAdapter = {
    'broadcast': function(source, param) {
      var collectListeners, listeners, mediumsArray, uniqueListeners;
      mediumsArray = sourceToMediumMap[source];
      listeners = [];
      collectListeners = function(m) {
        var listenersOfM;
        listenersOfM = this.listenersOf(m);
        listeners = _.union(listeners, _.compact(listenersOfM));
      };
      angular.forEach(mediumsArray, collectListeners, this);
      uniqueListeners = _.uniq(listeners);
      angular.forEach(uniqueListeners, function(listener) {
        return listener(param);
      });
      return true;
    },
    'on': function(destination, listener) {
      var mediumsArray;
      mediumsArray = destinationToMediumMap[destination];
      angular.forEach(mediumsArray, function(m) {
        return push(m, listener, eventListeners);
      });
      return true;
    },
    'listenersOf': function(medium) {
      return eventListeners[medium];
    }
  };
  return eventAdapter;
});
