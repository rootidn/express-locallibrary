var mongoose = require('mongoose');

var Schema = mongoose.Schema;

const { DateTime } = require("luxon");

var AuthorSchema = new Schema({
    first_name: {type:String, required:true, maxLength:100},
    family_name: {type:String, required:true, maxLength:100},
    date_of_birth: {type:Date},
    date_of_death: {type:Date}
});

// Virtual untuk author fullname
AuthorSchema
    .virtual('name')
    .get(function() {
        var fullname = '';
        if(this.first_name && this.family_name) {
            fullname = this.first_name + ', ' + this.family_name;
        }
        if(!this.first_name || !this.family_name) {
            fullname = '';
        }
        return fullname;
    })

// Virtual untuk author lifespan
AuthorSchema
    .virtual('lifespan')
    .get(function() {
        var lifetime_string = 0;
        if(this.date_of_birth) {
            lifetime_string = this.date_of_birth.getFullYear().toString();
        }
        lifetime_string += ' - ';        
        if(this.date_of_birth) {
            lifetime_string += this.date_of_death.getFullYear();
        }
        return lifetime_string;
    })

// Virtual untuk menyederhanakan date format
AuthorSchema
    .virtual('date_of_birth_formatted')
    .get(function() {
        return this.date_of_birth ? DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED) : '';
    });
AuthorSchema
    .virtual('date_of_death_formatted')
    .get(function() {
        return this.date_of_death ? DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED) : '';
    });
    
AuthorSchema
    .virtual('date_of_birth_form')
    .get(function () {
        return this.date_of_birth ? DateTime.fromJSDate(this.date_of_birth).toISODate() : '';
    });
AuthorSchema
    .virtual('date_of_death_form')
    .get(function () {
        return this.date_of_death ? DateTime.fromJSDate(this.date_of_death).toISODate() : '';
    });
// Virtual untuk author url
AuthorSchema
    .virtual('url')
    .get(function() {
        return '/catalog/author/' + this._id;
    })

module.exports = mongoose.model('Author', AuthorSchema);