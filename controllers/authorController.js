var Author = require('../models/author');
var Book = require('../models/book');
var async = require('async');
const { body,validationResult } = require('express-validator');

// Display list of all Authors.
exports.author_list = function(req, res, next) {
    Author.find()
        .sort([['family_name', 'ascending']])
        .exec(function (err, list_authors) {
            if (err) { return next(err) }
            res.render('author_list', {title:'Author List', author_list:list_authors, name:'authors'});
        })
};

// Display detail page for a specific Author.
exports.author_detail = function(req, res) {
    async.parallel({
        author : function(callback) {
            Author.findById(req.params.id)
                .exec(callback)
        },
        authors_books : function(callback) {
            Book.find({'author': req.params.id}, 'title summary')
                .exec(callback)
        }
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.author == null) {
            var err = new Error('Author not found');
            err.status = 404;
            return next(err)
        }
        res.render('author_detail', {title: "Author Detail", author: results.author, author_books: results.authors_books})
    })
};

// Display Author create form on GET.
exports.author_create_get = function(req, res) {
    res.render('author_form', { title: 'Create Author' });
};

// Handle Author create on POST.
exports.author_create_post = [
    // validasi
    body('first_name').trim().isLength({min: 1}).escape().withMessage('First name must be specified')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters'),
    body('family_name').trim().isLength({min: 1}).escape().withMessage('Family name must be specified')
        .isAlphanumeric().withMessage('Family name has non-alphanumeric characters'),
    body('date_of_birth', 'Invalid date of birth').optional({checkFalsy: true}).isISO8601().toDate(),
    body('date_of_death', 'Invalid date of death').optional({checkFalsy: true}).isISO8601().toDate(),
    // proses request
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.render('author_form', { title: 'Create Author', author: author, errors: errors.array() })
        } else {
            var author = new Author(
                {
                    first_name: req.body.first_name,
                    family_name: req.body.family_name,
                    date_of_birth: req.body.date_of_birth,
                    date_of_death: req.body.date_of_death
                }
            )
            author.save(function(err) {
                if(err) { return next(err) }
                res.redirect(author.url)
            })
        }
    }
]

// Display Author delete form on GET.
exports.author_delete_get = function(req, res, next) {
    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id).exec(callback)
        },
        authors_books: function(callback) {
            Book.find({'author' : req.params.id}).exec(callback)
        },
    }, function(err, results) {
        if (err) return next(err);
        if (results.author==null) {
            res.redirect('/catalog/authors');
        }
        res.render('author_delete', {title: 'Delete Author', author: results.author, author_books: results.authors_books})
    })
};

// Handle Author delete on POST.
exports.author_delete_post = function(req, res, next) {
    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id).exec(callback)
        },
        authors_books: function(callback) {
            Book.find({'author' : req.params.id}).exec(callback)
        },
    }, function(err, results) {
        if (err) {return next(err)}
        if (results.authors_books.length > 0) {
            res.render('author_delete', {title: 'Delete Author', author: results.author, author_books: results.authors_books})
            return;
        } else {
            Author.findByIdAndDelete(req.body.authorid, function deleteAuthor(err) {
                if (err) { return next(err); }
                res.redirect('/catalog/authors')
            })
        }
    })
};

// Display Author update form on GET.
exports.author_update_get = function(req, res) {
    Author.findById(req.params.id)
        .exec(function (err, author) {
            if (err) { return next(err) }
            res.render('author_form', {title:'Update Author', author : author});
        })
};

// Handle Author update on POST.
exports.author_update_post = [
    // validasi
    body('first_name').trim().isLength({min: 1}).escape().withMessage('First name must be specified')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters'),
    body('family_name').trim().isLength({min: 1}).escape().withMessage('Family name must be specified')
        .isAlphanumeric().withMessage('Family name has non-alphanumeric characters'),
    body('date_of_birth', 'Invalid date of birth').optional({checkFalsy: true}).isISO8601().toDate(),
    body('date_of_death', 'Invalid date of death').optional({checkFalsy: true}).isISO8601().toDate(),
    // proses request
    (req, res, next) => {
        const errors = validationResult(req);
        var author = new Author(
            {
                first_name: req.body.first_name,
                family_name: req.body.family_name,
                date_of_birth: req.body.date_of_birth,
                date_of_death: req.body.date_of_death,
                _id: req.params.id
            }
        )
        if (!errors.isEmpty()) {
            res.render('author_form', {title:'Update Author', author : author, errors: errors.array()});
            return;
        } else {
            Author.findByIdAndUpdate(req.params.id, author, {}, function(err, theauthor) {
                if (err) {return next(err)}
                res.redirect(theauthor.url)
            })
        }
    }
]