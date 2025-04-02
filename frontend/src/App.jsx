import { Route, Routes } from "react-router";
import Home from "./pages/Home";
import Form from "./pages/Form";
import NotFound from "./pages/NotFound";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/form" element={<Form />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

export default App;
