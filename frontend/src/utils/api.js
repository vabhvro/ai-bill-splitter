import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

export const scanBill = (formData) =>
  API.post("/bills/upload", formData);

export const getHistory = async () => {
  return API.get("/history");
};

export const deleteHistory = async (id) => {
  return API.delete(`/history/${id}`);
};

export const clearHistory = async () => {
  return API.delete("/history");
};

export const splitBill = async (payload) => {
  return API.post("/bills/split", payload);
};

export const analyseBill = async (payload) => {
  return API.post("/bills/analyze", payload);
};

export const sendEmail = async (payload) => {
  return API.post("/bills/send-email", payload);
};