const Menu = require('../models/menu.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * @description Get all menu items
 * @route `/api/menu/all`
 * @access Private
 * @method GET
 */
exports.getAllMenuItems = catchAsync(async (req, res, next) => {
    try {
        const menu = await Menu.find();

        if (!menu || menu.length === 0) {
            return next(
                new AppError(
                  'No menu found!', 
                  404
                )
            );
        }
    
        res.status(200).json({
            message: "Menu list retrieved successfully",
            data: menu
        });
    } catch (error) {
        return next(
            new AppError(
              'Error occurred, please try again!', 
              500
            )
        );
    }
});

/**
 * @description Create a new menu item
 * @route `/api/menu/create`
 * @access Private
 * @method POST
 */
exports.createMenuItem = catchAsync(async (req, res, next) => {
    try {
        const menuItem = await Menu.create(req.body);
        
        res.status(201).json({
            message: "Menu item created successfully",
            data: menuItem
        });
    } catch (error) {
        return next(
            new AppError(
              'Error occurred while creating menu item!', 
              500
            )
        );
    }
});

/**
 * @description Edit a menu item
 * @route `/api/menu/edit/:id`
 * @access Private
 * @method PUT
 */
exports.editMenuItem = catchAsync(async (req, res, next) => {
    try {
        const menuItemId = req.params.id;
        const updatedMenuItem = await Menu.findByIdAndUpdate(menuItemId, req.body, { new: true });
        
        if (!updatedMenuItem) {
            return next(
                new AppError(
                  'Menu item not found!', 
                  404
                )
            );
        }
        
        res.status(200).json({
            message: "Menu item updated successfully",
            data: updatedMenuItem
        });
    } catch (error) {
        return next(
            new AppError(
              'Error occurred while updating menu item!', 
              500
            )
        );
    }
});
