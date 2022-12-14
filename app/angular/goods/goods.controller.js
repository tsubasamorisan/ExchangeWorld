'use strict';

const goodsModule = require('./goods.module');
const _           = require('lodash');
const moment      = require('moment');
const marked      = require('marked');
marked.setOptions({
	renderer: new marked.Renderer(),
	gfm: false,
	tables: false,
	breaks: true,
	pedantic: false,
	sanitize: false,
	smartLists: false,
	smartypants: false
});


goodsModule.controller('GoodsController', GoodsController);

/** @ngInject */
function GoodsController(
	auth,
	NgMap,
	goodData,
	comments,
	AvailableCategory,
	goodsService,
	notification,
	colorThief,
	favorite,
	logger,
	$state,
	$stateParams,
	$scope,
	$rootScope,
	$localStorage,
	$location,
	$mdDialog,
	$timeout,
	$window,
	$sce
) {
	const vm = this;

	vm.openSetting       = ($mdOpenMenu, ev) => $mdOpenMenu(ev);
	vm.goodData          = goodData;
	vm.goodDesc          = $sce.trustAsHtml(marked(goodData.description));
	vm.availableCategory = AvailableCategory.slice(1);
	vm.bgStyle           = '';
	vm.bordercolor       = ['',''];

	vm.comment         = '';
	vm.goodComments    = comments;
	vm.onSubmitComment = onSubmitComment;
	vm.onDeleteComment = onDeleteComment;

	vm.stars       = [];
	vm.isEditing   = false;
	vm.onEdit      = onEdit;
	vm.onDelete    = onDelete;
	vm.onClickStar = onClickStar;

	vm.queuingList   = [];
	vm.onClickQueue  = onClickQueue;

	vm.showPhotoViewer = showPhotoViewer;

	vm.getGoodsDescription = getGoodsDescription;
	activate();

	$scope.removeMode = false;
	// $scope.$parent.$on('mapInitialized', mapInitialized);

	/* After map is loaded */
	NgMap.getMap().then(mapInitialized);
	function mapInitialized() {
		$scope.$parent.$broadcast('goodsChanged', [goodData]);
		$scope.$parent.$broadcast('mapMoveTo', goodData.position_y, goodData.position_x);
		$scope.$parent.$broadcast('markGoodViewed', goodData.gid);
	}

	function activate() {
		$scope.$parent.$broadcast('goodsChanged', [goodData]);
		$scope.$parent.$broadcast('mapMoveTo', goodData.position_y, goodData.position_x);
		$scope.$parent.$broadcast('markGoodViewed', goodData.gid);
		
		updateComment();
		updateStar();

		if ($rootScope.isLoggedIn) {
			goodsService
				.getQueue($stateParams.gid)
				.then(function(data) {
					vm.queuingList = data;
				});
		}

		goodData.category_alias = _.result(_.find(AvailableCategory, 'label', goodData.category), 'alias');

		getBackgroundColor();
	}

	function onEdit() {
		vm.isEditing = !vm.isEditing;
		if (vm.isEditing) return;

		let newValue = {
			gid         : vm.goodData.gid,
			name        : vm.goodData.name,
			category    : vm.goodData.category,
			description : vm.goodData.description
		};

		goodsService
			.editGood(newValue) 
			.then(function(data) {
				goodData.category_alias = _.result(_.find(AvailableCategory, 'label', goodData.category), 'alias');
				logger.success('???????????????', data, 'Edit');
				$state.reload();
			})
			.catch(function(err) { 
				logger.error('??????', err, 'Error');
			});
	}

	function onDelete() {
		var confirm = $mdDialog.confirm()
			.title('????????????')
			.content('????????????????????????????????????')
			.ariaLabel('Delete Goods')
			.ok('??????')
			.cancel('??????')
			.targetEvent();

		if (!confirm) return;

		$mdDialog.show(confirm).then(function() {
			goodsService
				.deleteGoods( vm.goodData.gid )
				.then(function(data) {
					logger.success('????????????', data, 'DONE');
					$state.go('root.withSidenav.seek');
				});
		});
	}

	function updateComment() {
		goodsService
			.getComment(vm.goodData.gid)
			.then(function(data) {
				vm.goodComments = data;
				vm.newComments = [];
			})
			.then(function() {
				var data = vm.goodComments.map(function(comment) {
					if ($rootScope.isLoggedIn) comment.isMe = (comment.commenter_uid === $localStorage.user.uid);
					comment.timestamp = moment(comment.created_at.slice(0, -1)).add(8, 'h').fromNow();
					return comment;
				});
				vm.goodComments = data.reverse();
			});
	}

	function onSubmitComment() {
		if (!$rootScope.isLoggedIn) {
			$rootScope.openSignupModal();
			return;
		}

		const mesg = vm.comment.trim();
		if (mesg) {
			const commentData = {
				commenter_uid : $rootScope.user.uid,
				goods_gid     : goodData.gid,
				content       : mesg,
			};
			vm.goodComments.push(commentData);
			goodsService
				.postComment(commentData)
				.then(function() {
					vm.comment = '';
					updateComment();
				});
		}
	}

	function onDeleteComment(cid) {
		var confirm = $mdDialog.confirm()
			.title('????????????')
			.content('????????????????????????????????????')
			.ariaLabel('Delete Comment')
			.ok('??????')
			.cancel('??????')
			.targetEvent();

		if (!confirm) return;

		$mdDialog.show(confirm).then(function() {
			goodsService
				.deleteComment({ cid: cid })
				.then(updateComment);
		});
	}

	async function onClickStar() {
		if (!$rootScope.isLoggedIn) {
			$rootScope.openSignupModal();
			return;
		}
		let isFavorite = await favorite.favorite(vm.goodData);
		vm.goodData.starredByUser = isFavorite;
	}

	function updateStar() {
		favorite
			.getFavorites(vm.goodData.gid)
			.then(function(data) {
				vm.stars = data;
			});
	}

	function onClickQueue() {
		if (!$rootScope.isLoggedIn) {
			$rootScope.openSignupModal();
			return;
		}
		const types = ['want_to_queue', 'see_who_queue'];
		var type = vm.goodData.owner.uid === $rootScope.user.uid ? 'see_who_queue' : 'want_to_queue';
		if(goodData.status === 1) return;

		if(type === types[0]) {
			$state.go('root.withSidenav.goods.queue', {}, {location:false});
		} else if(type === types[1]) {
			$state.go('root.withSidenav.goods.queuing',{}, {location:false});
		} else {
			$state.go('root.404');
		}
	}

	function showPhotoViewer() {
		$mdDialog.show({	
			clickOutsideToClose: true,
			templateUrl: 'goods/goods.photoViewer.html',
			controllerAs: 'vm',
			controller: popupController,
			locals: {
				photos: vm.goodData.photo_path
			}
		});
		function popupController($mdDialog, photos) {
			const vm = this;
			vm.photos = photos;
			vm.cancel = ()=> $mdDialog.cancel();
		}
	}

	function getGoodsDescription() {
		return marked(vm.goodData.description);
	}

	function getBackgroundColor() {
		var ct = new colorThief.ColorThief();
		var image = document.getElementById('img');
		image.onload = ()=> {
			var pallete = ct.getPalette(image, 2);
			vm.bgStyle = {
				"background-color": `rgb(${pallete[0][0]}, ${pallete[0][1]}, ${pallete[0][2]})`,
				"border-radius": "5px"
			};
			vm.bordercolor = [{
				"border": `rgb(${pallete[1][0]}, ${pallete[1][1]}, ${pallete[1][2]}) solid 2px`
			},{
				"border": `rgb(${pallete[2][0]}, ${pallete[2][1]}, ${pallete[2][2]}) solid 2px`
			}];
		};
	}
}


