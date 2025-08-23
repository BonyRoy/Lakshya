import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Pages/Login";
import Admin from "./Pages/Admin";
import User from "./Pages/User";
import MaintainDb from "./Admin Components/MaintainDb";
import Analysis from "./Admin Components/Analysis";

const App = () => {
  return (
    <BrowserRouter>
      {/* <Navbar /> */}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/user" element={<User />} />
        <Route path="/Analysis" element={<Analysis />} />
        <Route path="/MaintainDb" element={<MaintainDb />} />
      </Routes>
      {/* <Footer /> */}
    </BrowserRouter>
  );
};

export default App;
