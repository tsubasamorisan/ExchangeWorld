'use strict';

var express = require('express');
var router  = express.Router();

// Including tables
var goods   = require('../ORM/Goods');
var users   = require('../ORM/Users');

router.get('/', function(req, res, next) {

    // Available query params:
    //
    // title
    // wishlist
    // category
    // position_x
    // position_y
    // from
    // to
    //

    // Get property:value in ?x=y&z=w....
    var title    = req.query.title || '';
    var wishlist = req.query.wishlist || '';
    var category = req.query.category || '';
    var px       = parseFloat(req.query.px) || -1.0;
    var py       = parseFloat(req.query.py) || -1.0;
    var from     = parseInt(req.query.from) || -1;
    var to       = parseInt(req.query.to) || -1;

	// Set association between tables (user, goods)
	user.hasMany(goods, {foreignKey:'owner_uid'});
	goods.belongsTo(user, {foreignKey: 'owner_uid'});

    // Emit a find operation with orm model in table `goods`
    goods
        .sync({force: false})
        .then(function() {
    		/*
    		 * SELECT `goods`.*, `users`.*
    		 *   FROM `goods`, `users`
    		 *  WHERE `goods`.owner_uid = `users`.uid AND `goods`.name = %title%
             */
    		return goods.findAll({
                where: {
                    gname: {
                        $like: '%' + title + '%'
                    },
                    status: 0,
                    deleted: 0
                },
    			include: [users]
            });
        })
        .then(function(result) {
            res.json(result);
        });
});

module.exports = router;
