// lib/utils.js
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"


// lib/utils.js

// Function to generate unique login IDs for users
export const generateLoginId = () => {
    const date = new Date().toLocaleDateString('en-GB').replace(/\//g, ''); 
    const ms = Date.now().toString().slice(-6); 
    return `DTS_${date}${ms}`;
};

//password generator for new users created by admin
export const generateRandomPassword = () => {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const nums = "0123456789";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const chars = "!@#$%^&*";

    const getRand = (str, len) => 
        Array.from({ length: len }, () => str.charAt(Math.floor(Math.random() * str.length))).join('');

    return (
        getRand(upper, 4) + 
        getRand(nums, 2) +  
        getRand(lower, 2) + 
        getRand(chars, 1)   
    );
};

// Validation functions for email and phone number
export const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Phone number should be 10 digits and only contain numbers
export const validatePhone = (phone) => {
    return /^[0-9]{10}$/.test(phone);
};



export function cn(...inputs) {
  return twMerge(clsx(inputs));
}


