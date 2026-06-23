const DEV_URL = "http://10.60.152.37:3000";
const PROD_URL = "https://api.rovr.in";

export const BASE_URL = __DEV__
  ? DEV_URL
  : PROD_URL;