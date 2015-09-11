'use strict';

const messageModule = require('./message.module');
const _             = require('lodash');

messageModule.factory('message', message);

/** @ngInject */
function message(Restangular, $q, exception, $localStorage, $mdDialog) {
	const service = {
		getMessage,
		getConversation,
		postMessage,
		updateMessage,
		showMessagebox,
	};

	return service;

	function getMessage(uid) {
		const defer = $q.defer();

		Restangular
			.all('message')
			.getList({ 
				receiver_uid: uid,
				number: 9999,
			})
			.then(function(data) {
				if (_.isArray(data)) {
					defer.resolve(data);
				}
			})
			.catch(function(error) {
				return exception.catcher('[message Service] getMessage error: ')(error);
			});
		return defer.promise;
	}

	/**
	 * Get two users conversations history. 
	 */
	function getConversation(uid1, uid2, from, number) {
		const defer = $q.defer();
		Restangular
			.all('message')
			.getList({ 
				user1_uid : uid1,
				user2_uid : uid2,
				from      : from,
				number    : number,
			})
			.then(function(data) {
				if (_.isArray(data)) {
					defer.resolve(data);
				}
			})
			.catch(function(error) {
				return exception.catcher('[message Service] getConversation error: ')(error);
			});
		return defer.promise;
	}

	function postMessage(newMessage) {
		const defer = $q.defer();

		Restangular
			.all('message')
			.post(newMessage)
			.then(function(data) {
				defer.resolve(data);
			})
			.catch(function(error) {
				return exception.catcher('[message Service] postMessage error: ')(error);
			});
		return defer.promise;
	}

	function updateMessage(message) {
		const defer = $q.defer();

		message.route = 'message/read';

		message
			.put()
			.then(function(data) {
				defer.resolve(data);
			})
			.catch(function(error) {
				return exception.catcher('[Messages Service] updateMessage error: ')(error);
			});
		return defer.promise;
	}

	function showMessagebox(ev, msg, callback) {
		$mdDialog.show({
			clickOutsideToClose : true,
			templateUrl : 'utils/message/message.html',
			controllerAs : 'vm',
			controller : DialogController,
			locals: {
				msg: msg,
				callback: callback,
			}
		});
	}
}

/** @ngInject */
function DialogController(msg, callback, $mdDialog, logger, message) {
	const vm   = this;
	vm.msg     = msg;
	vm.history = '';
	vm.content = '';
	vm.cancel  = onCancel;
	vm.submit  = onSubmit;
	
	activate();

	function activate() {
		
	}

	function onSubmit(msg_content) {
		$mdDialog
			.hide(msg_content)
			.then(function(msg_content) {
				message.
					postMessage({
						receiver_uid : msg.sender_uid,
						sender_uid   : msg.receiver_uid,
						content      : msg_content,
					})
					.then(function(data) {
						if(callback) callback();
						logger.success('訊息已寄出', data, 'DONE');
					});
			});
	}

	function onCancel() {
		$mdDialog.cancel();
	}
}
