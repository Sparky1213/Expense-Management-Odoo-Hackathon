const roleCheck = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required.' 
        });
      }

      const userRole = req.user.role;
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ 
          success: false, 
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${userRole}` 
        });
      }

      next();
    } catch (error) {
      console.error('Role check middleware error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error during role verification.' 
      });
    }
  };
};

// Specific role checkers
const adminOnly = roleCheck('admin');
const managerOrAdmin = roleCheck('admin', 'manager');
const employeeOrAbove = roleCheck('admin', 'manager', 'employee');

module.exports = {
  roleCheck,
  adminOnly,
  managerOrAdmin,
  employeeOrAbove
};
