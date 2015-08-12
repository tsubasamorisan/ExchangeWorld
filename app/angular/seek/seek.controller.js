'use strict';

const seekModule = require('./seek.module');
seekModule.controller('SeekController', SeekController);

/** @ngInject */
function SeekController(seekService, $state) {
	var vm          = this;
	vm.goods        = []; 
	vm.onClickGoods = onClickGoods;

	activate();

	/////////

	function activate() {
		seekService
			.getSeek()
			.then(function(data) {
				vm.goods = data;
			})
			.catch(function() {
				vm.goods = undefined;
			});
	}

	//goods onClick event: change route to corrsponding gid
	function onClickGoods(_gid) {
		$state.go('root.withSidenav.goods', { gid: _gid });
	}
}
