'use strict';

const messageModule = require('./message.module');
const _ = require('lodash');
const moment = require('moment');

messageModule.factory('message', message);

/** @ngInject */
function message(Restangular, $q, exception, $mdDialog, $localStorage, $rootScope, $mdMedia) {
	var socket = new WebSocket(`ws://exwd.csie.org:43002/message?token=${$localStorage.token}`);
	var dataStream = [];

	socket.onopen = function(evt) {
		console.log('connected', evt);
	};
	socket.onclose = function(evt) {
		console.log('closed', evt);
	};
	socket.onmessage = function(evt) {
		console.log('receive', evt);
		dataStream.push(JSON.parse(evt.data));
	};
	socket.onerror = function(evt) {
		console.log('error', evt);
	};

	async function getMessageList() {
		const defer = $q.defer();
		const user = $localStorage.user;

		if (!user) {
			defer.reject({
				error: true
			});
			return defer.promise;
		}

		try {
			let list = await Restangular.one('user', user.uid).getList('chatroom');
			defer.resolve(list);
		} catch (err) {
			defer.reject(err);
		}

		return defer.promise;
	}

	async function getChatroomInfo(cid) {
		const defer = $q.defer();

		if (!cid) {
			defer.reject({
				error: true
			});
			return defer.promise;
		}

		try {
			let info = await Restangular.one('chatroom', cid).get();
			defer.resolve(info);
		} catch (err) {
			defer.reject(err);
		}

		return defer.promise;
	}

	async function getConversation(cid, number, offset) {
		const defer = $q.defer();

		try {
			let history = await Restangular.one('chatroom', cid).all('message').getList({
				offset: offset,
				limit: number
			});
			defer.resolve(history.reverse());
		} catch (err) {
			defer.reject(err);
		}

		return defer.promise;
	}

	async function postMessage(newMessage) {
		const defer = $q.defer();

		try {
			let chat = JSON.stringify(newMessage);
			await socket.send(chat);
			defer.resolve(newMessage);
		} catch (err) {
			defer.reject(err);
		}

		return defer.promise;
	}

	function showMessagebox(ev, msg) {
		let mdScope = $rootScope.$new();
		mdScope.instance = $mdDialog.show({
			clickOutsideToClose: true,
			fullscreen: ($mdMedia('sm') || $mdMedia('xs')),
			templateUrl: 'utils/message/message.html',
			controllerAs: 'vm',
			controller: 'm_messageController',
			scope: mdScope,
			resolve: {
				info: function() {
					console.log(msg);
					return getChatroomInfo(msg.cid);
				}
			}
		});
	}

	const service = {
		dataStream,
		getMessageList,
		getChatroomInfo,
		getConversation,
		postMessage,
		showMessagebox,
	};

	return service;
}
