'use strict';

const notificationModule = require('./notification.module');
const _                  = require('lodash');

notificationModule.factory('notificationService', notification);

/** @ngInject */
function notification(Restangular, $q, exception, $localStorage) {
	const service = {
		getNotification,
		postNotification,
		updateNotification,
	};

	return service;

	function getNotification(uid) {
		const defer = $q.defer();

		Restangular
			.all('notification/belongsTo')
			.getList({ receiver_uid: uid })
			.then(function(data) {
				if (_.isArray(data)) {
					defer.resolve(data);
				}
			})
			.catch(function(error) {
				return exception.catcher('[notification Service] getNotification error: ')(error);
			});
		return defer.promise;
	
	}

	function postNotification(newNotice) {
		const defer = $q.defer();

		Restangular
			.all('notification')
			.post(newNotice)
			.then(function(data) {
				defer.resolve(data);
			})
			.catch(function(error) {
				return exception.catcher('[Notification Service] postNotification error: ')(error);
			});
		return defer.promise;
	}

	function updateNotification(nid, unread) {
		const defer = $q.defer();

		Restangular
			.all('notification')
			.getList({nid: nid})
			.then(function(data) {
				if (_.isArray(data)) {
					console.log(data);
					var notification = data[0];
					notification.unread = unread;
					notification.put();
				}
			})
			.catch(function(error) {
				return exception.catcher('[Notifications Service] updateNotification error: ')(error);
			});
		return defer.promise;
	}
}
