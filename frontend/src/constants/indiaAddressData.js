/**
 * India Address Data - States, Cities, and Pincodes
 * Simplified dataset for address selection
 */

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];

// Popular cities by state (major cities for easy selection)
export const CITIES_BY_STATE = {
  "Andhra Pradesh": [
    "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati", "Kakinada", "Kadapa", "Anantapur"
  ],
  "Arunachal Pradesh": [
    "Itanagar", "Naharlagun", "Pasighat", "Tawang", "Ziro", "Bomdila", "Tezu", "Roing", "Daporijo", "Aalo"
  ],
  "Assam": [
    "Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Bongaigaon", "Dhubri", "Diphu"
  ],
  "Bihar": [
    "Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Arrah", "Bihar Sharif", "Katihar", "Chapra"
  ],
  "Chhattisgarh": [
    "Raipur", "Bhilai", "Bilaspur", "Korba", "Raigarh", "Durg", "Rajnandgaon", "Jagdalpur", "Ambikapur", "Dhamtari"
  ],
  "Goa": [
    "Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Bicholim", "Curchorem", "Sanquelim", "Valpoi", "Sanguem"
  ],
  "Gujarat": [
    "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar", "Junagadh", "Gandhidham", "Anand"
  ],
  "Haryana": [
    "Faridabad", "Gurgaon", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula"
  ],
  "Himachal Pradesh": [
    "Shimla", "Mandi", "Solan", "Dharamshala", "Bilaspur", "Kullu", "Chamba", "Hamirpur", "Una", "Nahan"
  ],
  "Jharkhand": [
    "Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh", "Deoghar", "Giridih", "Ramgarh", "Medininagar", "Chaibasa"
  ],
  "Karnataka": [
    "Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum", "Gulbarga", "Davangere", "Bellary", "Bijapur", "Raichur"
  ],
  "Kerala": [
    "Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Malappuram", "Kannur", "Kollam", "Alappuzha", "Palakkad", "Kottayam"
  ],
  "Madhya Pradesh": [
    "Indore", "Bhopal", "Gwalior", "Jabalpur", "Raipur", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam"
  ],
  "Maharashtra": [
    "Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur", "Thane", "Kalyan", "Vasai-Virar", "Navi Mumbai"
  ],
  "Manipur": [
    "Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Ukhrul", "Kakching", "Senapati", "Tamenglong", "Jiribam", "Kangpokpi"
  ],
  "Meghalaya": [
    "Shillong", "Tura", "Jowai", "Nongstoin", "Baghmara", "Williamnagar", "Resubelpara", "Mawkyrwat", "Ampati", "Nongpoh"
  ],
  "Mizoram": [
    "Aizawl", "Lunglei", "Saiha", "Champhai", "Kolasib", "Serchhip", "Lawngtlai", "Mamit", "Khawzawl", "Hnahthial"
  ],
  "Nagaland": [
    "Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Mon", "Zunheboto", "Phek", "Kiphire", "Longleng"
  ],
  "Odisha": [
    "Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Baleshwar", "Bhadrak", "Baripada", "Balangir"
  ],
  "Punjab": [
    "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Pathankot", "Hoshiarpur", "Batala", "Moga", "Abohar"
  ],
  "Rajasthan": [
    "Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", "Bharatpur", "Sikar"
  ],
  "Sikkim": [
    "Gangtok", "Namchi", "Mangan", "Gyalshing", "Ravangla", "Singtam", "Rangpo", "Jorethang", "Pelling", "Lachung"
  ],
  "Tamil Nadu": [
    "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Erode", "Vellore", "Dindigul", "Thanjavur"
  ],
  "Telangana": [
    "Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Ramagundam", "Khammam", "Mahbubnagar", "Nalgonda", "Adilabad", "Siddipet"
  ],
  "Tripura": [
    "Agartala", "Udaipur", "Dharmanagar", "Kailasahar", "Belonia", "Khowai", "Ambassa", "Sabroom", "Kamalpur", "Teliamura"
  ],
  "Uttar Pradesh": [
    "Lucknow", "Kanpur", "Agra", "Varanasi", "Meerut", "Allahabad", "Bareilly", "Aligarh", "Moradabad", "Saharanpur"
  ],
  "Uttarakhand": [
    "Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur", "Kashipur", "Rishikesh", "Nainital", "Almora", "Pithoragarh"
  ],
  "West Bengal": [
    "Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman", "Malda", "Baharampur", "Habra", "Kharagpur"
  ],
  "Andaman and Nicobar Islands": [
    "Port Blair", "Garacharma", "Bambooflat", "Bakultala", "Havelock", "Mayabunder", "Rangat", "Diglipur", "Car Nicobar", "Campbell Bay"
  ],
  "Chandigarh": [
    "Chandigarh", "Manimajra", "Burail", "Sector 17", "Sector 22", "Sector 35", "Sector 43", "Sector 45", "Industrial Area", "Panchkula"
  ],
  "Dadra and Nagar Haveli and Daman and Diu": [
    "Silvassa", "Daman", "Diu", "Dadra", "Naroli", "Vapi", "Kachigam", "Amli", "Kadaiya", "Rakholi"
  ],
  "Delhi": [
    "New Delhi", "Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", "Central Delhi", "Noida", "Gurgaon", "Faridabad"
  ],
  "Jammu and Kashmir": [
    "Srinagar", "Jammu", "Anantnag", "Baramulla", "Sopore", "Kathua", "Udhampur", "Rajouri", "Poonch", "Doda"
  ],
  "Ladakh": [
    "Leh", "Kargil", "Drass", "Nubra", "Zanskar", "Nyoma", "Diskit", "Turtuk", "Chushul", "Hundar"
  ],
  "Lakshadweep": [
    "Kavaratti", "Agatti", "Minicoy", "Andrott", "Kadmat", "Kiltan", "Chetlat", "Amini", "Bitra", "Kalpeni"
  ],
  "Puducherry": [
    "Puducherry", "Karaikal", "Mahe", "Yanam", "Ozhukarai", "Villianur", "Bahour", "Nettapakkam", "Mannadipet", "Ariyankuppam"
  ]
};

// Common pincode ranges by state (for reference, users can type any 6-digit pincode)
export const PINCODE_RANGES_BY_STATE = {
  "Andhra Pradesh": "500000-535000",
  "Arunachal Pradesh": "790000-792000",
  "Assam": "780000-788000",
  "Bihar": "800000-855000",
  "Chhattisgarh": "490000-497000",
  "Goa": "403000-403800",
  "Gujarat": "360000-396000",
  "Haryana": "120000-137000",
  "Himachal Pradesh": "171000-177000",
  "Jharkhand": "800000-835000",
  "Karnataka": "560000-591000",
  "Kerala": "670000-695000",
  "Madhya Pradesh": "450000-488000",
  "Maharashtra": "400000-445000",
  "Manipur": "795000-796000",
  "Meghalaya": "793000-794000",
  "Mizoram": "796000-797000",
  "Nagaland": "797000-798000",
  "Odisha": "750000-770000",
  "Punjab": "140000-160000",
  "Rajasthan": "300000-345000",
  "Sikkim": "737000-737200",
  "Tamil Nadu": "600000-643000",
  "Telangana": "500000-509000",
  "Tripura": "799000-799200",
  "Uttar Pradesh": "200000-277000",
  "Uttarakhand": "248000-249000",
  "West Bengal": "700000-744000",
  "Andaman and Nicobar Islands": "744000-744300",
  "Chandigarh": "160000-160100",
  "Dadra and Nagar Haveli and Daman and Diu": "396000-396200",
  "Delhi": "110000-110100",
  "Jammu and Kashmir": "180000-194000",
  "Ladakh": "194000-194200",
  "Lakshadweep": "682500-682600",
  "Puducherry": "605000-605100"
};

/**
 * Get cities by state
 */
export const getCitiesByState = (state) => {
  return CITIES_BY_STATE[state] || [];
};

/**
 * Get pincode range by state (for validation reference)
 */
export const getPincodeRangeByState = (state) => {
  return PINCODE_RANGES_BY_STATE[state] || null;
};

/**
 * Validate pincode format (6 digits)
 */
export const validatePincode = (pincode) => {
  return /^\d{6}$/.test(pincode);
};

