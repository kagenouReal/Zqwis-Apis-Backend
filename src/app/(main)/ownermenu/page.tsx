"use client";
import { useState, useEffect } from "react";

export default function Dashboard() {
const [isDark, setIsDark] = useState(false);
useEffect(() => {
const savedTheme = localStorage.getItem("theme");
if (savedTheme) {
document.documentElement.classList.toggle("dark", savedTheme === "dark");
setIsDark(savedTheme === "dark");
} else {
const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
document.documentElement.classList.toggle("dark", systemDark);
setIsDark(systemDark);
}
}, []);
return (
<>
{/*==============*/}
{/*==============*/}
</>
);
}