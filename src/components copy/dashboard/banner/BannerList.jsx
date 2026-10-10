/* eslint-disable @next/next/no-img-element */
import BannerDelete from './BannerDelete';

const BannerList = ({banners}) => {

  return (
    <div className="w-full max-w-md">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className="flex items-center justify-between bg-white p-4 mb-2 shadow rounded"
          >
            <div className="flex items-center">
              <img
                src={banner.image}
                alt={`Banner ${index + 1}`}
                className="w-16 h-16 object-cover rounded mr-4"
              />
              <span className="truncate max-w-xs">{banner.name}</span>
            </div>
            <BannerDelete bannerId={banner.id} />
          </div>
        ))}
      </div>
  );
};

export default BannerList;