var Genre = require('../models/genre');
var Book = require('../models/book');
var async = require('async');
const {body, validationResult} = require('express-validator');
const genre = require('../models/genre');
// var mongoose = require('mongoose');

// Display list of all Genre.
exports.genre_list = function(req, res) {
    Genre.find()
        .sort([['name', 'ascending']])
        .exec(function (err, list_genre) {
            if(err) { return next(err)}
            res.render('genre_list', {title: 'Genre List', genre_list: list_genre, name: 'genres'})
        })
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {
    // var id = mongoose.Types.ObjectId(req.params.id);
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
                .exec(callback)
        },
        genre_books: function(callback) {
            Book.find({'genre': req.params.id})
                .exec(callback)
        },
    }, function(err, result) {
        if (err) { return next(err) }
        if (result.genre == null) {
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err)
        }
        res.render('genre_detail', {title: 'Genre Detail', genre: result.genre, genre_books: result.genre_books});
    });
};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res) {
    res.render('genre_form', { title: 'Create genre'});
};

// Handle Genre create on POST.
exports.genre_create_post = [
    //validasi field name
    body('name', 'Genre name is required').trim().isLength({min: 1}).escape(),
    //proses request
    (req, res, next) => {
        const errors = validationResult(req);
        var genre = new Genre(
            { name: req.body.name }
        );
        if (!errors.isEmpty()) {
            // terjadi kesalahan input
            res.render('genre_form', {title: 'Create genre', genre: genre, errors: errors.array()});
            return;
        } else {
            // input valid
            Genre.findOne({ 'name' : req.body.name })
                .exec(function(err, found_genre) {
                    if (err) { return next(err); }
                    if (found_genre) {
                        //genre udah ada, redirect ke detail page
                        res.redirect(found_genre.url);
                    } else {
                        //genre baru, simpan lalu redirect
                        genre.save(function(err) {
                            if (err) { return next(err) }
                            res.redirect(genre.url);
                        });
                    }
                });
        }
    }
];

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res, next) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id).exec(callback);
        },
        books: function(callback) {
            Book.find({'genre' : req.params.id}).exec(callback);
        }
    }, function(err, results) {
        if (err) { return next(err); }
        res.render('genre_delete', {title: 'Delete Genre', genre: results.genre, books: results.books})
    })
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res, next) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id).exec(callback);
        },
        books: function(callback) {
            Book.find({'genre' : req.params.id}).exec(callback);
        }
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.books.length > 0) {
            res.render('genre_delete', {title: 'Delete Genre', genre: results.genre, books: results.books})
            return;
        } else {
            Genre.findByIdAndDelete(req.body.genreid, function(callback) {
                if (err) { return next(err); }
                res.redirect('/catalog/genres')
            })
        }
    })
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res) {
    Genre.findById(req.params.id)
        .exec(function (err, genre) {
            if (err) { return next(err); }
            res.render('genre_form', { title: 'Create genre', genre: genre});
        });
};

// Handle Genre update on POST.
exports.genre_update_post = [
    //validasi field name
    body('name', 'Genre name is required').trim().isLength({min: 1}).escape(),
    //proses request
    (req, res, next) => {
        const errors = validationResult(req);
        var genre = new Genre(
            { 
                name: req.body.name,
                _id: req.params.id
            }
        );
        if (!errors.isEmpty()) {
            // terjadi kesalahan input
            res.render('genre_form', {title: 'Create genre', genre: genre, errors: errors.array()});
            return;
        } else {
            // input valid
            Genre.findByIdAndUpdate(req.params.id, genre, {}, function (err, thegenre) {
                if (err) { return next(err); }
                res.redirect(genre.url)
            })
        }
    }
];