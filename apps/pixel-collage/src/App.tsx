import Canvas from "./components/Canvas";
import Sidebar from "./components/Sidebar";

export default function App() {
  return (
    <div className="flex h-screen items-center justify-center bg-pink-100">
      <div className="flex h-[80vh] w-[80vw] overflow-hidden rounded-lg border-4 border-pink-300 shadow-lg">
        <Sidebar />
        <Canvas />
      </div>
    </div>
  );
}
