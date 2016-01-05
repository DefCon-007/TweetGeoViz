'use strict';

var Dispatcher = require('../dispatcher/appDispatcher.js'),
    ActionTypes = require('../constants/actionTypes.js'),
    EventEmitter = require('events').EventEmitter,
    assign = require('object-assign'),
    _ = require('lodash'),
    CHANGE_EVENT = 'change';

var _data = {
  searchUUID: undefined,
  tweets: [],
  selectedTweets: [],
  heatmapData: [],
  searchQuery: ''
};

var TweetsStore = assign({}, EventEmitter.prototype, {
  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  },

  emitChange: function() {
    this.emit(CHANGE_EVENT);
  },

  getData: function() {
    return _data;
  },

  _generateHeatMap: function(data) {
    data = data || [];

    var heatmapData = [];

    data.forEach(function(pin) {
      var coords = pin.geometry.coordinates,
          latLng = new google.maps.LatLng(coords[1], coords[0]);
      heatmapData.push(latLng);
    });

    return heatmapData;
  },

  getTweetsInBounds: function(bounds, searchQuery) {
    var result = [];
    var regex = new RegExp(searchQuery, 'ig');

    if (!bounds) {
      return;
    }

    _data.tweets.forEach(function(tweet) {
      var coords = tweet.geometry.coordinates,
          latLng = new google.maps.LatLng(coords[1], coords[0]);

      if (bounds.contains(latLng)) {
        tweet.text = tweet.text.replace(regex, '<mark>$&</mark>');
        result.push(tweet);
      }
    });

    return result;
  }
});

TweetsStore.dispatchToken = Dispatcher.register(function(action) {
  switch(action.actionType) {
    case ActionTypes.TWEETS_CHANGE_VALUE:
      _data[action.name] = action.value;

      TweetsStore.emitChange();

      break;
    case ActionTypes.TWEETS_SEARCH:
      _data.tweets = action.tweets;
      _data.searchQuery = action.searchQuery;
      _data.searchUUID = action.searchUUID;

      _data.heatMapData = TweetsStore._generateHeatMap(_data.tweets);

      TweetsStore.emitChange();
      break;
    case ActionTypes.MAP_CLICK:

      // if there are no tweets at all, then do not even bother
      if (!_data.tweets.length) {
        return;
      }

      _data.selectedTweets = TweetsStore.getTweetsInBounds(action.bounds,
        _data.searchQuery);

      TweetsStore.emitChange();
      break;
    default:
      // nothing to do
      break;
  }
});

module.exports = TweetsStore;