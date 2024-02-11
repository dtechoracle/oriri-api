const User = require('../models/user.model')
const sendEmail = require('../utils/sendEmail');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');

const signToken = id =>{
  return jwt.sign({id: id}, process.env.JWT_SECRET_KEY,{
      expiresIn: process.env.JWT_EXPIRES_IN
  });
};


createSendToken = (user, statusCode, res) =>{
  const token = signToken(user._id)
  
  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Set to expire in 30 days
    httpOnly: true,
  };
  
  if(process.env.NODE_ENV === 'production') cookieOptions.secure = true
  res.status(statusCode)
  .cookie("jwt", token, cookieOptions)
  .json({
      success: true,
      token,
      data: {
          user
      }
  })
}

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Ping Server Controller
 * @route `/api/auth/`
 * @access Public
 * @type POST
 */
exports.ping = catchAsync(async (req, res, next) => {
  res.status(200).json({
    success: true,
    status: 'success',
    message: 'Hello from Auth',
  });
});

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Signup Controller
 * @route `/api/auth/signup`
 * @access Public
 * @type POST
 */
exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, password} = req.body;

  // Check for required fields
  if (!name || !email || !password ) {
    return res.status(400).json({
      success: false,
      message: "Please fill in all the required fields"
    });
  }

  // Check if email already exists
  const existingEmail = await User.findOne({ email });

  if (existingEmail) {
    return res.status(400).json({
      success: false,
      message: 'The email address is already taken',
    });
  }

  const newUser = new User({
    name,
    email,
    password,
  });

  try {
    // Attempt to send the welcome email
    const message = `
    Hi ${name}, Welcome to 
    We're excited to have you on board! Explore and enjoy the features Massai has to offer.`;
  
    console.log('Recipient email:', newUser.email);

    await sendEmail({
      to: newUser.email,
      subject: 'Welcome to ',
      message,
    });

    // If the email was sent successfully, proceed to user creation
    await newUser.save({ validateBeforeSave: false });

    createSendToken(newUser, 201, res);
  } catch (error) {
    console.log(error);
    // Handle email sending error
    return res.status(500).json({
      success: false,
      message: "Couldn't send the welcome email",
      error: error.message,
    });
  }
});


/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Verify Users Email Controller
 * @route `/api/auth/verify`
 * @access Public
 * @type POST
 */
exports.verify = catchAsync(async (req, res, next) => {
  const { otpCode } = req.body;

  if (!otpCode) {
    return next(
      new AppError(
        'Please provide an otp code', 
        401
      )
    );
  }
  const user = await User.findOne({ otp: otpCode });
  
  if (!user) {
    return next(
      new AppError(
        'This otp code has expired or is invalid',
        401
      )
    );
  }

  if (user.isActive === true) {
    user.otp = null;
    return next(
      new AppError(
        'Your account has already been verified..', 
        400
      )
    );
  }

  //then change the user's status to active
  user.isActive = true;

  user.otp = null;

  await user.save({ validateBeforeSave: false });

  createSendToken(user, 200, res);
});


/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Login in User Controller
 * @route `/api/auth/login`
 * @access Public
 * @type POST
 */
exports.login = catchAsync(async (req, res, next) => {
  // Check if user and password exist
  const { email, password } = req.body;

  // Check if email and password exist
  if (!email || !password) {
    return next(
      new AppError(
        'Please provide email and password!', 
        400
      )
    );
  }

  // Check if user exists and password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User does not exist',
    });
  }

  if (user.isActive === false) {
    return next(
      new AppError('Please verify your email and try again.', 400)
    );
  }

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(
      new AppError(
        'Incorrect email or password', 
        401
      )
    );
  }


  createSendToken(user, 200, res);
});


/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Resend verification otp to users email Controller
 * @route `/api/auth/resendverification`
 * @access Public
 * @type POST
 */
exports.resendVerification = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(
      new AppError(
        'User not found',
        404
      )
    );
  }

  // if (user.isActive === true) {
  //   return res.status(400).json({
  //     status: false,
  //     message: 'Account has already been verified',
  //   });
  // }

  const otp = (user.otp = otpGenerator.generate(4, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
  }));

  await user.save({ validateBeforeSave: false });

    console.log(otp)
  const message = `
    Hi there ${user.name}!
    Here's a new code to verify your account.${otp}`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Verification Link 🚀!',
      message,
    });
    res.status(200).json({
      success: true,
      message: 'Verification link sent successfully!',
    });
  } catch (err) {
    user.otp = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      status: false,
      message: "Couldn't send the verification email",
    });
  }
});


/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Forogot Password Controller
 * @route `/api/auth/forgotPassword`
 * @access Public
 * @type POST
 */
exports.forgotPassword = catchAsync(async (req, res, next) => {
  //Get user based on email

  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(
      new AppError(
        'There is no user with this email address',
        404
      )
    );
  }

  const otp = (user.otp = otpGenerator.generate(4, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
  }));
  await user.save({ validateBeforeSave: false });

  console.log(otp);

  const message = `
    Hi ${user.name}
    We heard you are having problems with your password.
    here is your otp vefication code ${otp}
    Otp expires in 10 minutes.`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Forgot password',
      message,
    });

    res.status(200).json({
      success: true,
      message: 'Email sent sucessfully 🚀!',
    });
  } catch (err) {
    user.otp = null;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
});

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Reset Password Controller
 * @route `/api/auth/resetpassword`
 * @access Public
 * @type POST
 */
exports.resetPassword = catchAsync(async (req, res, next) => {
  //Get user based on the token
  const { otpCode } = req.body;

  if (!otpCode) {
    return next(
      new AppError(
        'Please provide an otp code', 
        401
      )
    );
  }
  const user = await User.findOne({ otp: otpCode });
  if (!user) {
    return next(
      new AppError(
        'This otp code has expired or is invalid', 
        401
      )
    );
  }

  console.log(user.otp);
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.otp = null;
  await user.save();

  createSendToken(user, 200, res);
});


exports.restrict = (...userTypes) => {
  return (req, res, next) => {

    if (!userTypes.includes(req.user.userType)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};



/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Controller for updating password
 * @route `/api/auth/updatepassword`
 * @access Private
 * @type PATCH
 */
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  // Check if current password, new password, and confirm password are provided
  if (!currentPassword || !newPassword || !confirmPassword) {
    return next(
      new AppError(
        'Please provide current password, new password, and confirm password',
        400
      )
    );
  }

  // Get the user from the database
  const user = await User.findById(req.user.id).select('+password');

  // Check if the current password is correct
  if (!(await user.correctPassword(currentPassword, user.password))) {
    return next(
      new AppError(
        'Current password is incorrect', 
        401
      )
    );
  }

  // Check if the new password and confirm password match
  if (newPassword !== confirmPassword) {
    return next(
      new AppError(
        "New password and confirm password don't match", 
        400
      )
    );
  }

  // Update the user's password
  user.password = newPassword;
  user.passwordConfirm = confirmPassword;
  await user.save();

  // Sign and send the updated token along with the user data
  createSendToken(user, 200, res);
});

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Logout Controller
 * @route `/api/auth/logout`
 * @access Public
 * @type POST
 */
exports.Logout = catchAsync(async (req, res, next) => {

  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Successfully logged out',
  });
});


//protect user that arent authenticated
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  )
    token = req.headers.authorization.split(' ')[1];

  if (!token) {
    return next(
      new AppError(
        'You are not logged in! Please log in to get access.', 
        401
      )
    );
  }

  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_KEY
  );

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'User recently changed password, please login again!', 
        401
      )
    );
  }

  req.user = currentUser;
  next();
});