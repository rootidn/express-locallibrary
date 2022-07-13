var Book = require('../models/book');
var Author = require('../models/author');
var Genre = require('../models/genre');
var BookInstance = require('../models/bookinstance');

var async = require('async');
const {body, validationResult} = require('express-validator');
const book = require('../models/book');

exports.index = function(req, res) {
    async.parallel({
        book_count: function (callback) {
            Book.countDocuments({}, callback);
        },
        book_instance_count: function (callback) {
            BookInstance.countDocuments({}, callback);
        },
        book_instance_available_count: function (callback) {
            BookInstance.countDocuments({status:'Available'}, callback);
        },
        author_count: function (callback) {
            Author.countDocuments({}, callback)
        },
        genre_count: function (callback) {
            Genre.countDocuments({}, callback)
        }
    },
    function(err, result) {
        res.render('index', {title: "Local Library Home", error:err, data:result, name: 'home'})
    });
};

// Display list of all books.
exports.book_list = function(req, res) {
    Book.find({}, 'title author')
        .sort({title:1})
        .populate('author')
        .exec(function (err, list_books) {
            if (err) { return next(err); }
            res.render('book_list', {title: "Book List", book_list: list_books, name: 'books'})
        })
};

// Display detail page for a specific book.
exports.book_detail = function(req, res) {
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id)
                .populate('author')
                .populate('genre')
                .exec(callback);
        },
        book_instance: function(callback) {
            BookInstance.find({'book': req.params.id})
                .exec(callback);
        } 
    }, function(err, result){
        if (err) { return next(err) }
        if (result.book == null) {
            var err = new Error('Book not found');
            err.status = 404;
            return next(err)
        }
        res.render('book_detail', {title: result.book.title, book: result.book, book_instances: result.book_instance})
    })
};

// Display book create form on GET.
exports.book_create_get = function(req, res, next) {
    // mendapatkan semua author dan genre, yang digunakan utk menambahkan buku
    async.parallel({
        authors: function(callback) {
            Author.find(callback);
        }, 
        genres: function(callback) {
            Genre.find(callback);
        }
    },  function(err, result) {
        if(err) { return next(err); }
        res.render('book_form', {title: 'Create Book', authors: result.authors, genres: result.genres})
    });
};

// Handle book create on POST.
exports.book_create_post = [
    //convert genre ke array
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)) {
            if(typeof req.body.genre == 'undefined') 
                req.body.genre = []
            else
                req.body.genre = new Array(req.body.genre);
        }
        next();
    },
    //validasi
    body('title', 'Title must not be empty.').trim().isLength({min: 1}).escape(),
    body('summary', 'Summary must not be empty.').trim().isLength({min: 1}).escape(),
    body('isbn', 'ISBN must not be empty.').trim().isLength({min: 1}).escape(),
    //proses request
    (req, res, next) => {
        const errors = validationResult(req);
        var book = new Book({
            title: req.body.title,
            author : req.body.author,
            summary : req.body.summary,
            isbn : req.body.isbn,
            genre : req.body.genre
        });
        if (!errors.isEmpty()) {
            // jika ada error maka balik ke form
            // mendapatkan semua author dan genre
            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                }, 
                genres: function(callback) {
                    Genre.find(callback);
                }
            },  function(err, results) {
                if(err) { next(err); }
                // atur kembali selected genre
                for (let i=0; i<results.genres.length; i++) {
                    if(book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked = 'true';
                    }
                }
                res.render('book_form', {title: 'Create Book', authors: results.authors, genres: results.genres,
                    book: book, errors: errors.array()});
            });
            return;
        }
        else {
            book.save(function (err) {
                if (err) { return next(err) }
                res.redirect(book.url)
            });
        }
    }
]

// Display book delete form on GET.
exports.book_delete_get = function(req, res, next) {
    async.parallel({
        book : function(callback) {
            Book.findById(req.params.id).populate('author').exec(callback);
        },
        bookinstances : function(callback) {
            BookInstance.find({'book': req.params.id}).exec(callback);
        }
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.book==null) {
            req.redirect('/catalog/books')
        }
        res.render('book_delete', {title:'Delete Book', book: results.book, bookinstances: results.bookinstances})
    })
};

// Handle book delete on POST.
exports.book_delete_post = function(req, res, next) {
    async.parallel({
        book :function(callback) {
            Book.findById(req.params.id).populate('author').exec(callback);
        },
        bookinstances : function(callback) {
            BookInstance.find({'book': req.params.id}).exec(callback);
        }
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.bookinstances.length > 0) {
            res.render('book_delete', {title:'Delete Book', book: results.book, bookinstances: results.bookinstances});
            return;
        } else {
            Book.findByIdAndDelete(req.body.bookid, function deleteBook(err) {
                if (err) {return next(err); }
                res.redirect('/catalog/books')
            })
        }
    })
};

// Display book update form on GET.
exports.book_update_get = function(req, res, next) {
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
        },
        authors: function(callback) {
            Author.find(callback)
        },
        genres: function(callback) {
            Genre.find(callback)
        }
    }, function(err, results) {
        if (err) {return next(err);}
        if (results.book == null) {
            var err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }
        // atur selected genre
        for (var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
            for (var book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
                if (results.genres[all_g_iter]._id.toString()===results.book.genre[book_g_iter]._id.toString()) {
                    results.genres[all_g_iter].checked='true';
                }
            }
        }
        res.render('book_form', {title:'Update Book', authors: results.authors, genres: results.genres, book: results.book});
    })
};

// Handle book update on POST.
exports.book_update_post = [
    // buat list genre
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)) {
            if(typeof req.body.genre==='undefined')
                req.body.genre = [];
            else
                req.body.genre = new Array(req.body.genre);
        }
        next();
    },
    //validasi
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('author', 'Author must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
    body('genre.*').escape(),
    //request proses
    (req, res, next) => {
        const errors = validationResult(req);
        var book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: (typeof req.body.genre==='undefined') ? [] : req.body.genre,
            _id:req.params.id //This is required, or a new ID will be assigned!
        })
        if(!errors.isEmpty()) {
            async.parallel({
                authors: function(callback) {
                    Author.find(callback)
                },
                genres: function(callback) {
                    Genre.find(callback)
                },
            }, function(err, results) {
                if (err) { return next(err) }
                // selected genre
                for(let i=0; i < results.genre.length; i++) {
                    if(book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked = true;
                    }
                }
                res.render('book_form', {title:'Update Book', authors: results.authors, genres: results.genres, book: book, errors: errors.array()});
            });
            return;
        } else {
            Book.findByIdAndUpdate(req.params.id, book, {}, function(err, thebook) {
                if (err) {return next(err)}
                res.redirect(thebook.url)
            })
        }
    }
]