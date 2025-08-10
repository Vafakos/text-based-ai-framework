import { Route, Routes } from "react-router";

import Home from "./pages/Home";
import Form from "./pages/Form";
import NotFound from "./pages/NotFound";
import StoryTree from "./pages/StoryTree";
import Play from "./pages/Play";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/form" element={<Form />} />
            <Route path="/story-tree" element={<StoryTree />} />
            <Route path="/play" element={<Play />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

export default App;
