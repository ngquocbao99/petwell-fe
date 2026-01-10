import ServiceCarousel from "@components/ServiceCarousel";
import ClinicCarousel from "@components/ClinicCarousel";
import KnowledgePostList from "./KnowledgePost";

const Home = () => {
  return (
    <div className="bg-white pt-24">
      <ServiceCarousel />
      <ClinicCarousel />
      <KnowledgePostList />
    </div>
  );
};

export default Home;
