var mongodb = require('./db');

function Post(user, title, post) {
    this.user = user;
    this.title = title;
    this.post = post;
}

module.exports = Post;

Post.prototype.save = function(callback) {
    var date = new Date();
    var time = {
        date: date,
        year : date.getFullYear(),
        month : date.getFullYear() + "-" + (date.getMonth()+1),
        day : date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate(),
        minute : date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes()
    }
    var post = {
        user: this.user,
        time: time,
        title: this.title,
        post: this.post
    };

    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //存储集合名为posts
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            collection.insert(post, {
                safe: true
            }, function (err,post) {
                mongodb.close();
                callback(err,post);
            });
        });
    });
};

// Post.getAll = function(user, callback) {//获取一个人的所有文章
//     mongodb.open(function (err, db) {
//         if (err) {
//             return callback(err);
//         }

//         db.collection('posts', function(err, collection) {
//             if (err) {
//                 mongodb.close();
//                 return callback(err);
//             }

//             var query={};
//             if(user){//因为index.js中app.get('/')为Post.getAll(null, function(err, posts){}),所以要判断user
//                 query.user=user;
//             }
//             collection.find(query).sort({
//                 time: -1
//             }).toArray(function (err, docs) {
//                 mongodb.close();
//                 if (err) {
//                     callback(err, null);
//                 }
//                 callback(null, docs);
//             });
//         });
//     });
// };
Post.getTen = function( user, page, callback ){//获取十篇文章
    mongodb.open(function( err, db ){
        if(err){
            return callback(err);
        }
        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            var query = {};
            if(user){
                query.user = user;
            }
            collection.find(query, {skip: (page -1)*10, limit: 10}).sort({
                time: -1
            }).toArray(function(err, docs){
                mongodb.close();
                if(err){
                    callback(err, null);
                }
                callback(null, docs);
            });
        });
    });
};


Post.getOne = function(user, day, title, callback) {//获取一篇文章
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }

        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            collection.findOne({"user":user,"time.day":day,"title":title},function (err, doc) {
                mongodb.close();
                if (err) {
                    callback(err, null);
                }
                callback(null, doc);
            });
        });
    });
};