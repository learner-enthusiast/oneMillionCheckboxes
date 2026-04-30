import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-yellow-400">
      <div className="rounded-2xl shadow-2xl p-8 w-full max-w-3xl text-center">
        <h1 className="text-2xl font-bold text-blue-600 mb-8">Choose an App</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* One Million Checkboxes */}
          <Card
            onClick={() => navigate("/app/checkboxes")}
            className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-blue-400"
          >
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold text-blue-600 mb-2">
                One Million Checkboxes
              </h2>
              <p className="text-gray-600">
                Explore a massive grid of checkboxes in real-time.
              </p>
            </CardContent>
          </Card>

          {/* Location App */}
          <Card
            onClick={() => navigate("/app/location")}
            className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-yellow-400"
          >
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold text-yellow-500 mb-2">
                Live Location Tracker
              </h2>
              <p className="text-gray-600">
                Share and view real-time user locations.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Home;
