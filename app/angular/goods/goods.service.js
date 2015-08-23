'use strict';

const goodsModule = require('./goods.module');
const _           = require('lodash');
goodsModule.factory('goodsService', goodsService);

/** @ngInject */
function goodsService(Restangular, $q, exception) {

	const service = {
		getGood,
		editGood, 
		getComment,
		postComment,
	};
	return service;


	function getGood(gid) {
		const defer = $q.defer();

		Restangular
			.all('goods')
			.getList({ gid : gid })
			.then(function(data) {
				if (_.isArray(data)) {
					defer.resolve(data[0]);
				} else if (_.isObject(data)) {
					defer.resolve(data);
				}
			})
			.catch(function(error) {
				return exception.catcher('[Goods Service] getGood error: ')(error);
			});
		return defer.promise;
	}

	function editGood() {
		return ;
	}

	function getComment(gid) {
		const defer = $q.defer();

		Restangular
			.all('comment/of/goods')
			.getList({ goods_gid : gid })
			.then(function(data) {
				if (_.isArray(data)) {
					defer.resolve(data);
				}
			})
			.catch(function(error) {
				return exception.catcher('[Goods Service] getComments error: ')(error);
			});
		return defer.promise;
	}

	function postComment(newComment) {
		Restangular.all('comment/post').post(newComment);
	}
}
