var mongodb = require('./db'),
    markdown = require('markdown').markdown;

function Post(user, head, title, tags, post) {
    this.user = user;
    this.head = head;
    this.title = title;
    this.tags = tags;
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
        head: this.head,
        time: time,
        title: this.title,
        tags: this.tags,
        pv: 0,
        post: this.post,
        comments: []
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
                //console.log(docs);
                docs.forEach(function(doc){
                    doc.post = markdown.toHTML(doc.post);
                });
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
            collection.findOne({"user":user,"time.day":day,"title":title}, function (err, doc) {
                mongodb.close();
                if (err) {
                    callback(err, null);
                }
                //console.log(doc);
                doc.post = markdown.toHTML(doc.post);
                //增加判断 是否存在评论
                if(doc.comments){
                    doc.comments.forEach(function(comment){
                        comment.content = markdown.toHTML(comment.content);
                    });
                }
                callback(null, doc);
            });

            //每次给pv键增加1
            //加了一个空回调函数，不加会报错 http://stackoverflow.com/questions/14407834/error-when-inserting-a-document-into-mongodb-via-node-js
            collection.update({"user":user,"time.day":day,"title":title},{$inc:{"pv":1}}, function(){});
        });
    });
};

Post.getArchive = function(callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }

        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            collection.find({},{"user":1,"time":1,"title":1}).sort({
                time:-1
            }).toArray(function(err, docs){
                mongodb.close();
                if (err) {
                    callback(err, null);
                }
                callback(null, docs);
            });
        });
    });
};

Post.getTag = function(callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }

        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //distinct用来找出给定键的所有不同值
            //"tags":[{"tag":tag1},{"tag":tag2},{"tag":tag3}]
            //http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#distinct
            collection.distinct("tags.tag",function(err, docs){
                mongodb.close();
                if (err) {
                    callback(err, null);
                }
                callback(null, docs);
            });
        });
    });
};

Post.getAllByTag = function(tag, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }

        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            collection.find({"tags.tag":tag},{"user":1,"time":1,"title":1}).sort({
                time:-1
            }).toArray(function(err, docs){
                mongodb.close();
                if (err) {
                    callback(err, null);
                }
                callback(null, docs);
            });
        });
    });
};

Post.search = function(keyword, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }

        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var pattern = new RegExp("^.*"+keyword+".*$", "i");
            collection.find({"title":pattern},{"user":1,"time":1,"title":1}).sort({
                time:-1
            }).toArray(function(err, docs){
                mongodb.close();
                if (err) {
                    callback(err, null);
                }
                callback(null, docs);
            });
        });
    });
};
