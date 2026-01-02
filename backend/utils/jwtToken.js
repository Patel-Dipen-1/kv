// Create Token and saving in cookie

const sendToken = (user, statusCode, res, customUserData = null) => {
  const token = user.getJWTToken();

  // options for cookie
  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  // Convert user to object and remove sensitive fields
  const userData = customUserData || user.toObject();
  delete userData.password;
  delete userData.passwordResetToken;
  delete userData.passwordResetExpires;

  // Convert roleRef.permissions Map to plain object for JSON serialization
  if (userData.roleRef && userData.roleRef.permissions) {
    if (userData.roleRef.permissions instanceof Map) {
      const permissionsObj = {};
      userData.roleRef.permissions.forEach((value, key) => {
        permissionsObj[key] = value;
      });
      userData.roleRef.permissions = permissionsObj;
    }
  }

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user: userData,
    token,
  });
};

module.exports = sendToken;
