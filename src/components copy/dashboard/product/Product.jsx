import { CustomButton, CustomCart, CustomContainer } from "@/components/ui";
import { H2, P } from "@/components/ui/tags";
import Image from "next/image";
import Link from "next/link";
import { AiFillDelete, AiOutlineEdit } from "react-icons/ai";
import { FiPlus } from "react-icons/fi";
import product1 from "../../../../public/assets/ac1.jpg";
import { getProducts } from "@/queries/product";
import DeleteProduct from "./DeleteProduct";
import EditButton from "@/components/ui/EditButton";

export default async function Product() {
  const products = await getProducts();
  
  return (
    <>
      <section className="my-10">
        <CustomContainer>
          <CustomCart className="">
            <div className="tab:col-span-2 flex flex-col tab:flex-row gap-2 items-center justify-between">
              <H2 name="Product List" className="" />

              <Link
                href="/dashboard/product/add-product"
                className="flex items-center gap-1 bg-primary-color1 text-white py-2 px-5 rounded "
              >
                <FiPlus className="text-xl" />
                Add Product
              </Link>
            </div>

            {/* table */}
            <div className="mt-10 overflow-x-auto">
              <table class="border-collapse border border-slate-500 w-full">
                <thead>
                  <tr>
                    <th class="border border-custom-border font-bold text-custom-text1 p-3">
                      SL
                    </th>
                    <th class="border border-custom-border font-bold text-custom-text1 p-3">
                      Image
                    </th>
                    <th class="border border-custom-border font-bold text-custom-text1 p-3">
                      Short Description
                    </th>
                    <th class="border border-custom-border font-bold text-custom-text1 p-3">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {
                  products.length>0 ? products.map((product , index) => (
                      
                  <tr key={product.id}>
                  <td class="border border-custom-border text-custom-text2 p-3">
                    {index + 1}
                  </td>
                  <td class="border border-custom-border text-custom-text2 p-3">
                    <Image
                      src={product?.image ? product?.image : product1}
                      alt="img"
                      width="80"
                      height="80"
                      className="w-16 h-16 rounded m-auto"
                    />
                  </td>

                  <td class="border border-custom-border text-custom-text2 p-3">
                    <P
                      className="line-clamp-1"
                      name={product.title}
                    />
                  </td>

                  <td class="border border-custom-border text-custom-text2 p-3">
                    <div className="flex items-center gap-2">
                      <EditButton productId={product.id}/>
                      <DeleteProduct id={product.id} />
                 
                    </div>
                  </td>
                </tr>
                      
                    ))
                    : <tr><td className="text-center text-custom-text2 p-3" colSpan="4">No Data Found</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </CustomCart>
        </CustomContainer>
      </section>
    </>
  );
}
