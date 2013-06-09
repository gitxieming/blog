
/*
 * GET home page.
 */
var crypto = require('crypto'),
    User = require('../models/user.js'),
    Post = require('../models/post.js'),
    Comment = require('../models/comment.js');

    module.exports = function(app){    

        app.get('/', function(req, res){
            var page = req.query.p;
            if(!page){
                page = 1;
            }else{
                page = parseInt(page);
            }
            Post.getTen(null, page, function(err, posts){
                if(err){
                    posts = [];
                }
                res.render('index', {
                    title: '主页',
                    user: req.session.user,
                    posts: posts,
                    page: page,
                    postsLen: posts.length,
                    success: req.flash('success').toString()
                });
            });
        });

        app.get('/reg', checkNotLogin);
        app.get('/reg', function(req,res){
            res.render('reg',{
                title:'注册',
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            }); 
        });

        app.post('/reg', checkNotLogin);
        app.post('/reg', function(req,res){
            if(req.body['password-repeat'] != req.body['password']){
                req.flash('error','两次输入的口令不一致'); 
                return res.redirect('/reg');
            }
            var md5 = crypto.createHash('md5');
            var password = md5.update(req.body.password).digest('base64');
            var md5 = crypto.createHash('md5');
            var email_MD5 = md5.update(req.body.email.toLowerCase()).digest('base64');
            var head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";      
            var newUser = new User({
                name: req.body.username,
                password: password,
                email : req.body.email,
                head: head
            });
            User.get(newUser.name, function(err, user){
                if(user){
                    err = '用户已存在';
                }
                if(err){
                    req.flash('error', err);
                    return res.redirect('/reg');
                }
                newUser.save(function(err){
                    if(err){
                        req.flash('error',err);
                        return res.redirect('/reg');
                    }
                    req.session.user = newUser;
                    req.flash('success','注册成功');
                    res.redirect('/');
                });
            });
        });

        app.get('/login', checkNotLogin);
        app.get('/login', function(req, res){
            res.render('login',{
                title:'登录',
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            }); 
        });

        app.post('/login', checkNotLogin);
        app.post('/login', function(req, res){
            var md5 = crypto.createHash('md5'),
                password = md5.update(req.body.password).digest('base64');
            User.get(req.body.username, function(err, user){
                if(!user){
                    req.flash('error', '用户不存在'); 
                    return res.redirect('/login'); 
                }
                if(user.password != password){
                    req.flash('error', '密码错误'); 
                    return res.redirect('/login');
                }
                req.session.user = user;
                req.flash('success','登陆成功');
                res.redirect('/');
            });
        });

        app.get('/logout', checkLogin);
        app.get('/logout', function(req, res){
            req.session.user = null;
            req.flash('success','登出成功');
            res.redirect('back');//保留在本页
        });

        app.get('/post', checkLogin);
        app.get('/post', function(req, res){
            res.render('post',{
                title:'发表',
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            }); 
        });

        app.post('/post', checkLogin);
        app.post('/post', function(req, res){
            var currentUser = req.session.user,
                tags = [{"tag": req.body.tag1}, {"tag": req.body.tag2}, {"tag": req.body.tag3}], 
                post = new Post(currentUser.name, req.body.title, tags, req.body.post);
            post.save(function(err){
                if(err){
                    req.flash('error', err); 
                    return res.redirect('/');
                }
                req.flash('success', '发布成功!');
                res.redirect('/');
            });
        });

        app.get('/archive', function(req, res){
            Post.getArchive(function(err, posts){
                if(err){
                    req.flash('err', err);
                    return res.redirect('/');
                }
                res.render('archive', {
                    title: '存档',
                    posts: posts,
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            });
        });

        app.get('/tags', function(req,res){
            Post.getTag(function(err, posts){
                if(err){
                    req.flash('err',err);
                    return res.redirect('/');
                }
                res.render('tags',{
                    title: '标签',
                    posts: posts,
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            });
        });

        app.get('/tags/:tag', function(req,res){
            Post.getAllByTag(req.params.tag, function(err, posts){
                if(err){
                    req.flash('err',err); 
                    return res.redirect('/');
                }
                res.render('tag',{
                    title: 'TAG:'+req.params.tag,
                    posts: posts,
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            });
        });

        app.get('/links', function(req,res){
            res.render('links',{
                title: '友情链接',
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });

        app.get('/search', function(req,res){
            Post.search(req.query.keyword,function(err, posts){
                if(err){
                    req.flash('err',err); 
                    return res.redirect('/');
                }

                res.render('search',{
                    title: "SEARCH:"+req.query.keyword,
                    posts: posts,
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            });
        });                      

        app.get('/:user', function(req, res){
            if( req.params.user != 'tag' ){
                var page = req.query.p;
                if(!page){
                    page = 1;
                }else{
                    page = parseInt(page);
                }
                User.get(req.params.user, function(err, user){
                    if(!user){
                        req.flash('error', '用户不存在');
                        return res.redirect('/');
                    }

                    Post.getTen(req.params.user, page, function(err, posts){
                        if(err){
                            req.flash('err', err);
                            return res.redirect('/');
                        }
                        res.render('user', {
                            title: req.params.user,
                            posts: posts,
                            user: req.session.user,
                            page: page,
                            postsLen: posts.length,
                            success: req.flash('success').toString(),
                            error: req.flash('error').toString()
                        });
                    });
                });
            }
        });

        app.get('/:user/:day/:title', function(req,res){
            User.get(req.params.user,function(err, user){
                if(!user){
                    req.flash('error','用户不存在'); 
                    return res.redirect('/');
                }
                Post.getOne(req.params.user, req.params.day, req.params.title, function(err, post){
                    if(err){
                        req.flash('err',err); 
                        return res.redirect('/');
                    }
                    res.render('article',{
                        title: req.params.title,
                        post: post,
                        user: req.session.user,
                        success: req.flash('success').toString(),
                        error: req.flash('error').toString()
                    });
                });
            }); 
        });

        //发表评论
        app.post('/:user/:day/:title', function(req,res){
            var comment = null,
                date = new Date(),
                time = date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes();
            var md5 = crypto.createHash('md5'),
                email_MD5 = md5.update(req.body.email).digest('base64'),
                head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";
            if(req.session.user){
                var name=req.session.user.name;
                comment = {"name":name, "head": head, email":name+"@gmail.com", "website":"/"+name, "time":time, "content":req.body.content}
            } else {
                comment = {"name":req.body.name, "head": head, "email":req.body.email, "website":"http://"+req.body.website, "time":time, "content":req.body.content}
            }
            var oneComment = new Comment(req.params.user, req.params.day, req.params.title, comment);
            oneComment.save(function(err){
                if(err){
                    req.flash('error', err); 
                    return res.redirect('back');//保留在本页
                }
                req.flash('success', '评论成功!');
                res.redirect('back');//保留在本页
            });
        });

        //404
        app.all('*', function(req, res){
            res.render('404');
        });
};

function checkLogin(req, res, next){
    if(!req.session.user){
        req.flash('error','未登录'); 
        return res.redirect('/login');
    }
    next();
}


function checkNotLogin(req,res,next){
    if(req.session.user){
        req.flash('error','已登录'); 
        return res.redirect('/');
    }
    next();
}