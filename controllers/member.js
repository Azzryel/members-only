const Member = require("../models/member");

const async = require("async");
const { body, check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");

exports.member_create_get = (req, res, next) => {
    res.render("member_create_form", { title: "Create an account" });
};

exports.member_create_post = [

    // vali and sani
    body("username", "Username cant be less than 3chars").trim().isLength({min: 3}).escape(),
    body("password", "Password cant be less than 3chars").trim().isLength({min: 3}).escape(),
    check("confirmpassword", "Passwords do not match").custom((value, { req }) => value === req.body.password).escape(),                                                           

    (req, res, next) => {
        
        const errors = validationResult(req);
        

        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(req.body.password, salt);

        const member = new Member( 
            {
                username: req.body.username,
                password_hash: hash,
                club_member: false,
            }
        );

        if(!errors.isEmpty()) {
            res.render("member_create_form", { title: "Create an account", errors: errors.array() });
        }
        else {

            Member.findOne({ "username": req.body.username })
                .exec( (err, found_member) =>  {
                    if(err) { return next(err); }

                    if(found_member) {
                        const exists = "Username already exists";
                        res.render("member_create_form", { title: "Create an account", exists: exists });
                   }
                   else {
                       member.save( (err) => {
                        if(err) { return next(err); }
                        res.redirect("/");
                       });
                   }
                });
        }

    }
];

exports.member_login_get = (req, res, next) => {
    res.render("login_form", { title: "Login" });
};

exports.member_club = (req, res, next) => {

    Member.findById(res.locals.currentUser.id, function (err, member) {
        if (err) { return next(err); }
        member.club_member = true;
        member.save();
        res.redirect("/clubhouse");
      });
};

exports.member_admin_get = (req, res, next) => {
    res.render("confirm_admin", { title: "Get admin status" });
};

exports.member_admin_post = [

    check("adminpass", "Wrong secretpassword").trim().custom((value) => value === "secretpassword").escape(),

    (req, res, next) => {

        const errors = validationResult(req);

        if(!errors.isEmpty()) {
            res.render("confirm_admin", { title: "Your secret password does not match secretpassword", errors: errors.array() });
        }
        else {
            Member.findById(res.locals.currentUser.id, (err, member) => {
                if (err) { return next(err); }
                member.admin = true;
                member.save();
                res.redirect("/clubhouse");
            });
        }
    }
];