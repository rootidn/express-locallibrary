var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');

var async = require('async');
const {body, validationResult} = require('express-validator');

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res) {
    BookInstance.find()
        .populate('book')
        .exec(function (err, list_bookinstance) {
            if (err) {return next(err)}
            res.render('bookinstance_list', {title: 'Book Instance List', bookinstance_list : list_bookinstance, name:'bookintances'})
        })
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res) {
    BookInstance.findById(req.params.id)
        .populate('book')
        .exec(function (err, bookinstance) {
            if (err) { return next(err) }
            if (bookinstance == null) {
                var err = new Error('Book copy not found');
                err.status = 404;
                return next(err);
            }
            res.render('bookinstance_detail', {title:'Copy: '+bookinstance.book.title, bookinstance: bookinstance})
        })
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {
    Book.find({}, 'title')
        .exec(function (err, books) {
            if (err) { return next(err); }
            res.render('bookinstance_form', {title: 'Create Book Instance', book_list: books})
        });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    //validasi
    body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({min: 1}).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({checkFalsy: true}).isISO8601().toDate(),
    //proses request
    (req, res, next) => {
        const errors = validationResult(req);
        var bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
        });
        if(!errors.isEmpty()) {
            Book.find({}, 'title')
                .exec(function (err, books) {
                    if (err) { return next(err); }
                    res.render('bookinstance_form', {
                        title: 'Create Bookinstance', book_list: books,
                         errors: errors.array(), bookinstance: bookinstance
                    })
                });
            return;
            } else {
                bookinstance.save(function(err) {
                    if (err) { return next(err); }
                    res.redirect(bookinstance.url)
                });
            }
    }
]

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res) {
    BookInstance.findById(req.params.id)
        .populate('book')
        .exec(function (err, bookinstance) {
            if (err) { return next(err); }
            res.render('bookinstance_delete', {title:'Delete Bookinstance', bookinstance: bookinstance})
        });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res, next) {
    BookInstance.findById(req.params.id)
        .populate('book')
        .exec(function (err, bookinstance) {
            if (err) { return next(err); }
            BookInstance.findByIdAndDelete(req.body.bookinstanceid, function deleteBookInstance(err) {
                if (err) {return next(err)}
                res.redirect('/catalog/book/'+bookinstance.book._id)
            })
        });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res) {
    async.parallel({
        bookinstance: function(callback) {
            BookInstance.findById(req.params.id).populate('book').exec(callback);
        },
        books: function(callback) {
            Book.find(callback);
        }
    }, function(err, results) {
        if (err) { return next(err) }
        if (results.bookinstance == null) {
            var err = new Error('Book copy not found');
            err.status = 404;
            return next(err);
        }
        res.render('bookinstance_form', {title:'Update Book Instance', bookinstance: results.bookinstance, book_list: results.books})
    })
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
    //validasi
    body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({min: 1}).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({checkFalsy: true}).isISO8601().toDate(),
    //proses request
    (req, res, next) => {
        const errors = validationResult(req);
        var bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id
        });
        if(!errors.isEmpty()) {
            Book.find({}, 'title')
                .exec(function (err, books) {
                    if (err) { return next(err); }
                    res.render('bookinstance_form', {
                        title: 'Create Bookinstance', book_list: books,
                        bookinstance: bookinstance, errors: errors.array()
                    })
                });
            return;
            } else {
                BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function(err, thebookinstance){
                    if (err) { return next(err); }
                    res.redirect(thebookinstance.url)
                })
            }
    }
]