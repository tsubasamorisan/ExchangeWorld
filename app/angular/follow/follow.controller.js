'use strict';

const followModule = require('./follow.module');
const _            = require('lodash');

followModule.controller('FollowController', FollowController);

/** @ngInject */
function FollowController($state, followService, $stateParams) {
	var vm         = this;
	const types    = ['following', 'follower'];
	vm.type        = '';
	vm.followData  = [];
	vm.onClickUser = onClickUser;
	vm.onClickBack = onClickUser.bind(this, $stateParams.uid);

	/////////////
	activate();

	function activate() {
		if (!_.includes(types, $stateParams.type)) {
			$state.go('root.withSidenav.404');
		} else {
			vm.type = $stateParams.type;

			followService
				.getFollow($stateParams.uid, vm.type)
				.then(function(data) {
					vm.followData = data;
				})
				.catch(function() {
					vm.followData = undefined;
				});
		}
	}

	// define onClick event on goods owner
	function onClickUser(uid) {
		$state.go('root.withSidenav.profile', {
			uid: uid
		});
	}
}
