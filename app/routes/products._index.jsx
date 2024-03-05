import {useLoaderData, Link} from '@remix-run/react';
import {json} from '@shopify/remix-oxygen';
import {Pagination, getPaginationVariables, Image} from '@shopify/hydrogen';

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({context, request}) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 4,
  });

  const {products} = await context.storefront.query(ALL_PRODUCTS_QUERY, {
    variables: paginationVariables,
  });

  return json({products});
}

export default function Products() {
  /** @type {LoaderReturnData} */
  const {products} = useLoaderData();

  return (
    <div className="products">
      <h1>Shop All</h1>
      <Pagination connection={products}>
        {({nodes, isLoading, PreviousLink, NextLink}) => (
          <div>
            <PreviousLink>
              {isLoading ? 'Loading...' : <span>↑ Load previous</span>}
            </PreviousLink>
            <ProductGrid products={nodes} />
            <NextLink>
              {isLoading ? 'Loading...' : <span>Load more ↓</span>}
            </NextLink>
          </div>
        )}
      </Pagination>
    </div>
  );
}

/**
 * @param {{products: AllProductsFragment[]}}
 */
function ProductGrid({products}) {
  return (
    <div className="products-grid">
      {products.map((product, index) => (
        <ProductItem
          key={product.id}
          product={product}
          index={index}
        />
      ))}
    </div>
  );
}

/**
 * @param {{
 *   product: AllProductsFragment;
 *   index: number;
 * }}
 */
function ProductItem({product, index}) {    
    return (
        <div className='product'>
            <Link
                className="product-item"
                key={product.id}
                to={`/products/${product.handle}`}
                prefetch="intent"
            >
                {product?.images && (
                    <Image
                        alt={product.images.altText || product.title}
                        aspectRatio="1/1"
                        data={product.images.nodes[0].url}
                        src={product.images.nodes[0].url}
                        loading={index < 3 ? 'eager' : undefined}
                    />
                )}
                <h3>{product.title}</h3>
                <h4>${product.priceRange.minVariantPrice.amount} {product.priceRange.minVariantPrice.currencyCode}</h4>
            </Link>
            <div className='dots'>
                {product.options.length > 1 && (
                    product.options.map((option) => {
                        console.log(option);
                        if (option.name === 'Colour') {
                            return (
                                option.values.map((colourName) => (
                                    <Link to={`/products/${product.handle}?Colour=${colourName}&Size=S`}>
                                        <div key={colourName} className={`${colourName.replace(/\s+/g, '-')}`}></div>
                                    </Link>
                                ))
                            );
                        }
                        return null;
                    })
                )}
            </div>
        </div>
    );
}

const ALL_PRODUCTS_QUERY = `#graphql
  fragment ProductDetails on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    images(first: 1) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
    options {
        name
        values
    }
  }
  query AllProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 250, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...ProductDetails
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
    }
    }
  }
`;


/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @typedef {import('storefrontapi.generated').CollectionFragment} CollectionFragment */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
