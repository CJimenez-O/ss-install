// ============= Description =====================
// - Using site url and email as parameters we can
// - Grab post url from post-sitemap
// - After jumping to post, it searchs: 
// - DCM selector available
// - Search Selectors available
// - Site Name
// - Site Color
// - Site Image
// - Then add all values to Slickstream config
// - create config.json
// 
// 1. Onboard site 
// 2. Install plug in
// 3. Wait for SS to index 1 post 
// 4. Gernerate config 

// ============= Need to add =====================
// post url verification check or 404 
//
// nice possible trigger when site finishes " site review " ?
// run with button click ?

const GetSitemapLinks = require("get-sitemap-links").default;
const puppeteer = require("puppeteer");
var fs = require("fs");

async function run(homepageUrl, email) {
  const browser = await puppeteer.launch({
    headless: true,
    ignoreHTTPSErrors: true,
  });

  const page = await browser.newPage();
  // cloudflare bypass - temp solution 
  await page.setUserAgent('Mozilla/5.0 (Windows NT 5.1; rv:5.0) Gecko/20100101 Firefox/5.0')
  await page.setViewport({ width: 1280, height: 720 });

  // get post link from sitemap
  const postLinks = await GetSitemapLinks(`${homepageUrl}/post-sitemap.xml`);
  let postUrl = postLinks[2];

  // if sitemap index fails use homepage as url
  if(postUrl == undefined){
    postUrl = homepageUrl
  }
  // console.log(postLinks)
  // console.log(postUrl)
  

  // if post url gets 404, use homepage as link to scrape 
  try{
    let result = await page.goto(`${postUrl}`, {
      waitUntil: "domcontentloaded",
      timeout: 10000,
    });
    if(result.status() == 404){
      await page.goto(`${homepageUrl}`, {
        waitUntil: "domcontentloaded",
        timeout: 10000,
      });
      console.log(`Demo Link: ${homepageUrl}?enable-slickstream`);
    }else{
      console.log(`Demo Link: ${postUrl}?enable-slickstream`);
    }
  
  }catch (err){
    console.log('Error loading page:', err);

  }

  // check if DCM selectors exist
  let dcmSelector = await page.evaluate(() => {
    let dcmSelectorList = [
      "entry-content",
      "post-content",
      "elementor-widget-theme-post-content",
      "isopad",
    ];

    for (let i = 0; i <= dcmSelectorList.length - 1; i++) {
      try {
        if (
          document.querySelector(`.${dcmSelectorList[i]}`).innerHTML !== null
        ) {
          return dcmSelectorList[i];
        }
      } catch {
        console.log("Fail");
      }
    }
  });

  if (dcmSelector !== undefined) {
    console.log("\x1b[32m", "DCM: Success");
  } else {
    console.log("\x1b[31m", "DCM: Failed");
  }

  // check if search classes exist
  let searchFunc = await page.evaluate(() => {
    let existingSearch = [];

    let searchSelectors = [
      "search-toggle-icon",
      "wp-block-search__button-outside",
      "wp-block-search__icon-button",
      "feast-mobile-search",
      "search-form",
      "feastsearchtoggle",
      "search",
      "search-field",
      "search-toggle-open-container",
      "widget_search",
      "feast-mobile-search",
      "slide-search",
      "search-item",
      "site-search-toggle",
      "fa-search",
      "mobile-searchform",
      "feastsearchtoggle",
      "uagb-search-form__container",
    ];

    for (let i = 0; i <= searchSelectors.length - 1; i++) {
      try {
        if (document.querySelector(`.${searchSelectors[i]}`)) {
          existingSearch.push(`.${searchSelectors[i]}`);
        }
      } catch {
        console.log("fail");
      }
    }

    return existingSearch;
  });

  if (searchFunc.length !== 0) {
    console.log("\x1b[32m", "Search Hooks: Success");
  } else {
    console.log("\x1b[31m", "Search Hooks: Failed");
  }

  // get Site name from Meta
  let siteName = await page.evaluate(() => {
    return document.head
      .querySelector('meta[property="og:site_name"]')
      .getAttribute("content");
  });

  // get Site Image from meta

  let siteImage = await page.evaluate(() => {
    try {
      if (
        document.head
          .querySelector('meta[property="og:image"]')
          .getAttribute("content")
      ) {
        return document.head
          .querySelector('meta[property="og:image"]')
          .getAttribute("content");
      }
    } catch {
      return " ";
    }
  });


  // get color from navbar links

  let siteColor = await page.$eval("nav li  a", (el) =>
  getComputedStyle(el).getPropertyValue("color"));


  await page.screenshot({
    path: 'screenshot-end.jpg'
  });
  await browser.close();

  let config = `
  {
    "features": {
      "admin_product": "engagement-suite-for-bloggers",
      "admin_productTier": "essentials",
      "admin_hideCampaigns": true,
      "admin_hideContentGrids": true,
      "admin_hideSearchBoxes": true,
      "admin_hideAnalyticsGames": true,
      "admin_hideExclusiveContent": true,
      "admin_hideJourneyGuide": true,
      "admin_hideSSO": true,
      "enableFloatingButtons": true,
      "enableSearch": true,
      "enableSearchHooks": true,
      "enableInlineSearch": true,
      "enableFavorites": true,
      "enableFilmstrip": true,
      "enableJourneys": true,
      "enableVideos": true,
      "enableFormTracking": true,
      "enableEngagementReports": true,
      "enablePortal": true,
      "enableIndexing": true
    },
    "siteWide": {
      "general": {
        "admin_portalType": "v2",
        "language": "en",
        "adNetwork": " ",
        "verticals": [
          ""
        ],
        "adminEmails": [
          "${email}"
        ],
        "siteName": "${siteName}",
        "imageUrl": "${siteImage}",
        "highlightColor": "${siteColor}"
      },
      "indexing": {
        "admin_userVisibility": "visible",
        "titleSelection": "auto",
        "descriptionSelection": "auto",
        "categorySource": "auto",
        "pageSectionSource": "auto",
        "pageBreadcrumbSource": "auto",
        "useWpJson": true,
        "indexedDomains": [],
        "overrideSitemapUrls": [],
        "additionalSitemapUrls": [],
        "sitemapUrlsAsPosts": [],
        "additionalPageUrls": [],
        "excludePageUrls": [],
        "titleSelectors": [],
        "descriptionSelectors": [],
        "categorySelectors": [],
        "urlSegmentAliases": [],
        "themeSelectors": [],
        "dateSelectors": [],
        "authorSelectors": [],
        "imageSelectors": [],
        "parsingTokenDefinitions": [],
        "useScreenshots": "none"
      },
      "imageSelection": {
        "admin_userVisibility": "visible",
        "preferredSource": "auto",
        "ignoreImageUrls": [],
        "placeholderImageContainment": "auto"
      },
      "recommendations": {
        "admin_userVisibility": "visible"
      },
      "membership": {
        "admin_userVisibility": "visible",
        "signinPromptsMode": "default",
        "favoritesSignInRequired": true
      },
      "css": {
        "admin_userVisibility": "visible",
        "globalCss": "slick-film-strip{ margin-top: 10px;}"
      },
      "floatingButtons": {
        "compactMode": "default",
        "linkToSelectors": [],
        "shiftLeftSelectors": []
      },
      "searchButton": {},
      "favoriteButton": {
        "heartbeatIconType": "heart",
        "disableAnimation": true,
        "tongueDirection": "left"
      },
      "backToTopButton": {},
      "search": {
        "searchType": "default",
        "theme": "auto",
        "omitFields": [
          "section",
          "author",
          "imageOverlayText"
        ],
        "groupByFields": [
          "categories"
        ],
        "boostPopular": 2,
        "themeParameters": [],
        "searchSynonyms": [],
        "ignoreCategories": [],
        "ignoreKeywords": [],
        "searchIgnoreFields": [],
        "omitGroupTypes": [],
        "featuredGroups": []
      },
      "searchAdInjection": {
        "admin_userVisibility": "visible-for-bloggers",
        "searchSlotClassNames": []
      },
      "search3": {
        "admin_userVisibility": "hidden",
        "layout": "grid",
        "cardCorners": "rounded",
        "imageContainmentStyle": "cover",
        "buttonStyle": "auto",
        "cardWidth": "wide",
        "mobileCardWidth": "wide"
      },
      "searchHooks": {
        "admin_userVisibility": "visible",
        "selectors": ${JSON.stringify(searchFunc)}
      },
      "inlineSearch": {
        "admin_userVisibility": "visible",
        "widgets": [
          {
            "id": "below-content-DCM",
            "injection": "auto-inject",
            "initialGroup": "related",
            "injectionSelector": ${JSON.stringify("." + dcmSelector)},
            "injectionPosition": "after selector",
            "titleHtml": ${JSON.stringify(
              '<span class="ss-widget-title">Explore More</span>'
            )},
            "theme": "auto",
            "themeParameters": [],
            "fallbackGroup": "related",
            "inlineMode": "default",
            "omitPageTypes": []
          },
          {
            "id": "in-content-DCM",
            "injection": "auto-inject",
            "initialGroup": "related",
            "injectionSelector": ${JSON.stringify(
              "." + dcmSelector + " " + "p:nth-of-type(6)"
            )} ,
            "injectionPosition": "after selector",
            "theme": "auto",
            "themeParameters": [],
            "hideSearchBox": true,
            "hideShowMoreButton": true,
            "hideGroupMoreButtons": true,
            "fallbackGroup": "related",
            "inlineMode": "default",
            "omitPageTypes": []
          }
        ]
      },
      "favorites": {},
      "favoriteHooks": {
        "admin_userVisibility": "hidden",
        "selectors": []
      },
      "filmstrip": {
        "admin_userVisibility": "visible",
        "injection": "auto-inject",
        "injectFilmstripPosition": "after selector",
        "mode": "og-card",
        "cardCorners": "rounded",
        "imageContainment": "cover",
        "maxWidth": 1140
      },
      "filmstripToolbar": {
        "admin_userVisibility": "visible",
        "direction": "scroll-up",
        "injection": "auto-inject",
        "linkToBehaviorWhenVisible": "stick-to",
        "linkToBehaviorWhenVisibleMobile": "stick-to",
        "mode": "og-card",
        "imageContainment": "cover",
        "cardCorners": "rounded",
        "includeSearch": false,
        "directionMobile": "inherit",
        "injectionMobile": "inherit",
        "linkToSelectors": []
      },
      "games": {
        "admin_userVisibility": "hidden"
      },
      "stories": {
        "admin_userVisibility": "visible-for-bloggers"
      },
      "storyExplorer": {
        "admin_userVisibility": "visible-for-bloggers"
      },
      "storyViewer": {
        "admin_userVisibility": "visible-for-bloggers",
        "injection": "auto-inject",
        "position": "after selector"
      },
      "videos": {
        "admin_userVisibility": "visible"
      },
      "pdfs": {
        "admin_userVisibility": "hidden",
        "pdfUrlRegexes": []
      },
      "campaigns": {
        "admin_userVisibility": "visible-for-business"
      },
      "abTesting": {
        "admin_userVisibility": "hidden"
      },
      "engagementReports": {
        "admin_userVisibility": "visible",
        "optOuts": []
      },
      "theme": {
        "admin_userVisibility": "visible",
        "theme": "classic",
        "imageContainment": "auto",
        "themeParameters": []
      },
      "proxy": {
        "scriptsToDisable": [],
        "scriptsToEnable": []
      },
      "journeys": {
        "conversionPageUrls": [],
        "ignoreGaGoals": [],
        "ignoreGaEventsContaining": []
      },
      "chatbotMonitoring": {
        "chatbotType": "none"
      },
      "conversions": {
        "gaGoalConversions": "specified-goals",
        "gaGoals": [],
        "conversionPageUrls": [],
        "formSubmissionConversions": "all-submissions-except"
      },
      "exclusiveContent": {
        "containerSelectors": []
      },
      "highlight": {
        "selectors": [],
        "selectorsMobile": []
      },
      "journeyGuide": {
        "type": "floating",
        "position": "top-right",
        "positionMobile": "top-right",
        "bannerPosition": "top",
        "bannerPositionMobile": "top",
        "bannerScrollDirection": "scroll-up",
        "bannerScrollDirectionMobile": "inherit",
        "linkToSelectors": [],
        "linkToSelectorsMobile": [],
        "linkToBehavior": "adhere",
        "linkToBehaviorMobile": "adhere",
        "triggerSelectorsInView": []
      }
    },
    "groups": [
      {
        "id": "home",
        "internal_generated": true,
        "general": {
          "name": "Home",
          "description": "The home page of the site"
        },
        "applicability": {
          "admin_userVisibility": "visible",
          "sitemapTypes": [
            "home"
          ],
          "pageUrls": [],
          "ldJsonSchemas": [],
          "sitemapUrls": [],
          "groups": [],
          "categories": [],
          "bodyClasses": [],
          "themes": []
        },
        "indexing": {
          "admin_userVisibility": "visible"
        },
        "recommendations": {
          "admin_userVisibility": "visible"
        },
        "css": {
          "admin_userVisibility": "visible"
        },
        "floatingButtons": {
          "injection": "auto",
          "searchVisibility": "auto",
          "favoriteVisibility": "auto",
          "backToTopVisibility": "auto"
        },
        "search": {
          "admin_userVisibility": "visible",
          "searchGroupNames": []
        },
        "searchHooks": {
          "admin_userVisibility": "visible",
          "apply": "auto",
          "selectors": []
        },
        "inlineSearch": {
          "admin_userVisibility": "visible",
          "inlineSearchIds": []
        },
        "filmstrip": {
          "admin_userVisibility": "visible",
          "injection": "do-not-inject",
          "position": "after selector"
        },
        "filmstripToolbar": {
          "admin_userVisibility": "visible",
          "injection": "auto-inject"
        },
        "contentGrids": {
          "admin_userVisibility": "hidden"
        },
        "games": {
          "admin_userVisibility": "hidden",
          "inject": false
        },
        "storyViewer": {
          "admin_userVisibility": "hidden"
        },
        "storyCarousel": {
          "admin_userVisibility": "visible-for-bloggers",
          "injection": "auto-inject",
          "injectionPosition": "after selector"
        },
        "storyExplorer": {
          "admin_userVisibility": "visible-for-bloggers",
          "injection": "auto-inject",
          "position": "after selector"
        },
        "videos": {
          "admin_userVisibility": "visible"
        },
        "campaigns": {
          "admin_userVisibility": "visible-for-business",
          "slotIds": []
        },
        "images": {
          "admin_userVisibility": "visible",
          "imageContainment": "auto",
          "placeholderImageContainment": "auto"
        },
        "exclusiveContent": {
          "enable": "default"
        },
        "journeyGuide": {
          "behavior": "auto"
        }
      },
      {
        "id": "print-pages",
        "internal_generated": true,
        "general": {
          "name": "Print",
          "description": "Print pages"
        },
        "applicability": {
          "admin_userVisibility": "visible",
          "allowUnindexedPages": true,
          "pageUrls": [
            "regex:/\\/(wprm_)*print\\//"
          ],
          "ldJsonSchemas": [],
          "sitemapTypes": [],
          "sitemapUrls": [],
          "groups": [],
          "categories": [],
          "bodyClasses": [],
          "themes": []
        },
        "indexing": {
          "admin_userVisibility": "visible"
        },
        "recommendations": {
          "admin_userVisibility": "visible"
        },
        "css": {
          "admin_userVisibility": "visible"
        },
        "floatingButtons": {
          "injection": "do-not-inject",
          "searchVisibility": "auto",
          "favoriteVisibility": "auto",
          "backToTopVisibility": "auto"
        },
        "search": {
          "admin_userVisibility": "visible",
          "searchGroupNames": []
        },
        "searchHooks": {
          "admin_userVisibility": "visible",
          "apply": "auto",
          "selectors": []
        },
        "inlineSearch": {
          "admin_userVisibility": "visible",
          "inlineSearchIds": []
        },
        "filmstrip": {
          "admin_userVisibility": "visible",
          "injection": "do-not-inject",
          "position": "after selector"
        },
        "filmstripToolbar": {
          "admin_userVisibility": "visible",
          "injection": "do-not-inject"
        },
        "contentGrids": {
          "admin_userVisibility": "hidden"
        },
        "games": {
          "admin_userVisibility": "hidden",
          "inject": false
        },
        "storyViewer": {
          "admin_userVisibility": "hidden"
        },
        "storyCarousel": {
          "admin_userVisibility": "visible-for-bloggers",
          "injection": "auto-inject",
          "injectionPosition": "after selector"
        },
        "storyExplorer": {
          "admin_userVisibility": "visible-for-bloggers",
          "injection": "auto-inject",
          "position": "after selector"
        },
        "videos": {
          "admin_userVisibility": "visible"
        },
        "campaigns": {
          "admin_userVisibility": "visible-for-business",
          "slotIds": []
        },
        "images": {
          "admin_userVisibility": "visible",
          "imageContainment": "auto",
          "placeholderImageContainment": "auto"
        },
        "exclusiveContent": {
          "enable": "default"
        },
        "journeyGuide": {
          "behavior": "auto"
        }
      },
      {
        "id": "sitemapType:categories",
        "internal_generated": true,
        "general": {
          "name": "categories",
          "sectionName": "categories",
          "description": "sitemapType:categories"
        },
        "applicability": {
          "sitemapTypes": [
            "categories"
          ],
          "admin_userVisibility": "visible",
          "pageUrls": [],
          "ldJsonSchemas": [],
          "sitemapUrls": [],
          "groups": [],
          "categories": [],
          "bodyClasses": [],
          "themes": []
        },
        "indexing": {
          "admin_userVisibility": "visible"
        },
        "recommendations": {
          "admin_userVisibility": "visible"
        },
        "css": {
          "admin_userVisibility": "visible"
        },
        "floatingButtons": {
          "injection": "auto",
          "favoriteVisibility": "hidden",
          "searchVisibility": "auto",
          "backToTopVisibility": "auto"
        },
        "search": {
          "admin_userVisibility": "visible",
          "searchGroupNames": []
        },
        "searchHooks": {
          "admin_userVisibility": "visible",
          "apply": "auto",
          "selectors": []
        },
        "inlineSearch": {
          "admin_userVisibility": "visible",
          "inlineSearchIds": []
        },
        "filmstrip": {
          "admin_userVisibility": "visible",
          "injection": "do-not-inject",
          "position": "after selector"
        },
        "filmstripToolbar": {
          "admin_userVisibility": "visible",
          "injection": "do-not-inject"
        },
        "contentGrids": {
          "admin_userVisibility": "hidden"
        },
        "games": {
          "admin_userVisibility": "hidden",
          "inject": false
        },
        "storyViewer": {
          "admin_userVisibility": "hidden"
        },
        "storyCarousel": {
          "admin_userVisibility": "visible-for-bloggers",
          "injection": "auto-inject",
          "injectionPosition": "after selector"
        },
        "storyExplorer": {
          "admin_userVisibility": "visible-for-bloggers",
          "injection": "auto-inject",
          "position": "after selector"
        },
        "videos": {
          "admin_userVisibility": "visible"
        },
        "campaigns": {
          "admin_userVisibility": "visible-for-business",
          "slotIds": []
        },
        "images": {
          "admin_userVisibility": "visible",
          "imageContainment": "auto",
          "placeholderImageContainment": "auto"
        },
        "exclusiveContent": {
          "enable": "default"
        },
        "journeyGuide": {
          "behavior": "auto"
        }
      },
      {
        "id": "sitemapType:pages",
        "internal_generated": true,
        "general": {
          "name": "pages",
          "sectionName": "pages",
          "description": "sitemapType:pages",
          "searchable": true
        },
        "applicability": {
          "sitemapTypes": [
            "pages"
          ],
          "admin_userVisibility": "visible",
          "pageUrls": [],
          "ldJsonSchemas": [],
          "sitemapUrls": [],
          "groups": [],
          "categories": [],
          "bodyClasses": [],
          "themes": []
        },
        "indexing": {
          "admin_userVisibility": "visible"
        },
        "recommendations": {
          "admin_userVisibility": "visible"
        },
        "css": {
          "admin_userVisibility": "visible"
        },
        "floatingButtons": {
          "injection": "auto",
          "favoriteVisibility": "hidden",
          "searchVisibility": "auto",
          "backToTopVisibility": "auto"
        },
        "search": {
          "admin_userVisibility": "visible",
          "searchGroupNames": []
        },
        "searchHooks": {
          "admin_userVisibility": "visible",
          "apply": "auto",
          "selectors": []
        },
        "inlineSearch": {
          "admin_userVisibility": "visible",
          "inlineSearchIds": []
        },
        "filmstrip": {
          "admin_userVisibility": "visible",
          "injection": "do-not-inject",
          "position": "after selector"
        },
        "filmstripToolbar": {
          "admin_userVisibility": "visible",
          "injection": "auto-inject"
        },
        "contentGrids": {
          "admin_userVisibility": "hidden"
        },
        "games": {
          "admin_userVisibility": "hidden",
          "inject": false
        },
        "storyViewer": {
          "admin_userVisibility": "hidden"
        },
        "storyCarousel": {
          "admin_userVisibility": "visible-for-bloggers",
          "injection": "auto-inject",
          "injectionPosition": "after selector"
        },
        "storyExplorer": {
          "admin_userVisibility": "visible-for-bloggers",
          "injection": "auto-inject",
          "position": "after selector"
        },
        "videos": {
          "admin_userVisibility": "visible"
        },
        "campaigns": {
          "admin_userVisibility": "visible-for-business",
          "slotIds": []
        },
        "images": {
          "admin_userVisibility": "visible",
          "imageContainment": "auto",
          "placeholderImageContainment": "auto"
        },
        "exclusiveContent": {
          "enable": "default"
        },
        "journeyGuide": {
          "behavior": "auto"
        }
      },
      {
        "id": "sitemapType:posts",
        "internal_generated": true,
        "general": {
          "name": "posts",
          "sectionName": "posts",
          "description": "sitemapType:posts",
          "recommendable": true,
          "searchable": true
        },
        "applicability": {
          "sitemapTypes": [
            "posts",
            "articles",
            "wp-json-posts"
          ],
          "admin_userVisibility": "visible",
          "pageUrls": [],
          "ldJsonSchemas": [],
          "sitemapUrls": [],
          "groups": [],
          "categories": [],
          "bodyClasses": [],
          "themes": []
        },
        "indexing": {
          "admin_userVisibility": "visible"
        },
        "recommendations": {
          "admin_userVisibility": "visible"
        },
        "css": {
          "admin_userVisibility": "visible"
        },
        "floatingButtons": {
          "injection": "auto",
          "searchVisibility": "auto",
          "favoriteVisibility": "auto",
          "backToTopVisibility": "auto"
        },
        "search": {
          "admin_userVisibility": "visible",
          "searchGroupNames": []
        },
        "searchHooks": {
          "admin_userVisibility": "visible",
          "apply": "auto",
          "selectors": []
        },
        "inlineSearch": {
          "admin_userVisibility": "visible",
          "inlineSearchIds": [
            "in-content-DCM",
            "below-content-DCM"
          ]
        },
        "filmstrip": {
          "admin_userVisibility": "visible",
          "injection": "auto-inject",
          "position": "after selector"
        },
        "filmstripToolbar": {
          "admin_userVisibility": "visible",
          "injection": "auto-inject"
        },
        "contentGrids": {
          "admin_userVisibility": "hidden"
        },
        "games": {
          "admin_userVisibility": "hidden",
          "inject": false
        },
        "storyViewer": {
          "admin_userVisibility": "hidden"
        },
        "storyCarousel": {
          "admin_userVisibility": "visible-for-bloggers",
          "injection": "auto-inject",
          "injectionPosition": "after selector"
        },
        "storyExplorer": {
          "admin_userVisibility": "visible-for-bloggers",
          "injection": "auto-inject",
          "position": "after selector"
        },
        "videos": {
          "admin_userVisibility": "visible"
        },
        "campaigns": {
          "admin_userVisibility": "visible-for-business",
          "slotIds": []
        },
        "images": {
          "admin_userVisibility": "visible",
          "imageContainment": "auto",
          "placeholderImageContainment": "auto"
        },
        "exclusiveContent": {
          "enable": "default"
        },
        "journeyGuide": {
          "behavior": "auto"
        }
      },
      {
        "id": "sitemapType:wp-json-pages",
        "internal_generated": true,
        "general": {
          "name": "wp-json-pages",
          "sectionName": "wp-json-pages",
          "description": "sitemapType:wp-json-pages",
          "searchable": true
        },
        "applicability": {
          "sitemapTypes": [
            "wp-json-pages"
          ],
          "admin_userVisibility": "visible",
          "pageUrls": [],
          "ldJsonSchemas": [],
          "sitemapUrls": [],
          "groups": [],
          "categories": [],
          "bodyClasses": [],
          "themes": []
        },
        "indexing": {
          "admin_userVisibility": "visible"
        },
        "recommendations": {
          "admin_userVisibility": "visible"
        },
        "css": {
          "admin_userVisibility": "visible"
        },
        "floatingButtons": {
          "injection": "auto",
          "favoriteVisibility": "hidden",
          "searchVisibility": "auto",
          "backToTopVisibility": "auto"
        },
        "search": {
          "admin_userVisibility": "visible",
          "searchGroupNames": []
        },
        "searchHooks": {
          "admin_userVisibility": "visible",
          "apply": "auto",
          "selectors": []
        },
        "inlineSearch": {
          "admin_userVisibility": "visible",
          "inlineSearchIds": []
        },
        "filmstrip": {
          "admin_userVisibility": "visible",
          "injection": "do-not-inject",
          "position": "after selector"
        },
        "filmstripToolbar": {
          "admin_userVisibility": "visible",
          "injection": "auto-inject"
        },
        "contentGrids": {
          "admin_userVisibility": "hidden"
        },
        "games": {
          "admin_userVisibility": "hidden",
          "inject": false
        },
        "storyViewer": {
          "admin_userVisibility": "hidden"
        },
        "storyCarousel": {
          "admin_userVisibility": "visible-for-bloggers",
          "injection": "auto-inject",
          "injectionPosition": "after selector"
        },
        "storyExplorer": {
          "admin_userVisibility": "visible-for-bloggers",
          "injection": "auto-inject",
          "position": "after selector"
        },
        "videos": {
          "admin_userVisibility": "visible"
        },
        "campaigns": {
          "admin_userVisibility": "visible-for-business",
          "slotIds": []
        },
        "images": {
          "admin_userVisibility": "visible",
          "imageContainment": "auto",
          "placeholderImageContainment": "auto"
        },
        "exclusiveContent": {
          "enable": "default"
        },
        "journeyGuide": {
          "behavior": "auto"
        }
      },
      {
        "id": "sitemapType:wp-json-posts",
        "internal_generated": true,
        "general": {
          "name": "wp-json-posts",
          "sectionName": "wp-json-posts",
          "description": "sitemapType:wp-json-posts",
          "recommendable": true,
          "searchable": true
        },
        "applicability": {
          "sitemapTypes": [
            "wp-json-posts"
          ],
          "admin_userVisibility": "visible",
          "pageUrls": [],
          "ldJsonSchemas": [],
          "sitemapUrls": [],
          "groups": [],
          "categories": [],
          "bodyClasses": [],
          "themes": []
        },
        "indexing": {
          "admin_userVisibility": "visible"
        },
        "recommendations": {
          "admin_userVisibility": "visible"
        },
        "css": {
          "admin_userVisibility": "visible"
        },
        "floatingButtons": {
          "injection": "auto",
          "searchVisibility": "auto",
          "favoriteVisibility": "auto",
          "backToTopVisibility": "auto"
        },
        "search": {
          "admin_userVisibility": "visible",
          "searchGroupNames": []
        },
        "searchHooks": {
          "admin_userVisibility": "visible",
          "apply": "auto",
          "selectors": []
        },
        "inlineSearch": {
          "admin_userVisibility": "visible",
          "inlineSearchIds": []
        },
        "filmstrip": {
          "admin_userVisibility": "visible",
          "injection": "auto-inject",
          "position": "after selector"
        },
        "filmstripToolbar": {
          "admin_userVisibility": "visible",
          "injection": "auto-inject"
        },
        "contentGrids": {
          "admin_userVisibility": "hidden"
        },
        "games": {
          "admin_userVisibility": "hidden",
          "inject": false
        },
        "storyViewer": {
          "admin_userVisibility": "hidden"
        },
        "storyCarousel": {
          "admin_userVisibility": "visible-for-bloggers",
          "injection": "auto-inject",
          "injectionPosition": "after selector"
        },
        "storyExplorer": {
          "admin_userVisibility": "visible-for-bloggers",
          "injection": "auto-inject",
          "position": "after selector"
        },
        "videos": {
          "admin_userVisibility": "visible"
        },
        "campaigns": {
          "admin_userVisibility": "visible-for-business",
          "slotIds": []
        },
        "images": {
          "admin_userVisibility": "visible",
          "imageContainment": "auto",
          "placeholderImageContainment": "auto"
        },
        "exclusiveContent": {
          "enable": "default"
        },
        "journeyGuide": {
          "behavior": "auto"
        }
      },
      {
        "id": "group-other",
        "internal_generated": true,
        "general": {
          "name": "Other",
          "description": "Pages other than those found in sitemaps containing searchable content"
        },
        "applicability": {
          "admin_userVisibility": "visible",
          "pageUrls": [],
          "ldJsonSchemas": [],
          "sitemapTypes": [],
          "sitemapUrls": [],
          "groups": [],
          "categories": [],
          "bodyClasses": [],
          "themes": []
        },
        "indexing": {
          "admin_userVisibility": "visible"
        },
        "recommendations": {
          "admin_userVisibility": "visible"
        },
        "css": {
          "admin_userVisibility": "visible"
        },
        "floatingButtons": {
          "injection": "auto",
          "favoriteVisibility": "hidden",
          "searchVisibility": "auto",
          "backToTopVisibility": "auto"
        },
        "search": {
          "admin_userVisibility": "visible",
          "searchGroupNames": []
        },
        "searchHooks": {
          "admin_userVisibility": "visible",
          "apply": "auto",
          "selectors": []
        },
        "inlineSearch": {
          "admin_userVisibility": "visible",
          "inlineSearchIds": []
        },
        "filmstrip": {
          "admin_userVisibility": "visible",
          "injection": "do-not-inject",
          "position": "after selector"
        },
        "filmstripToolbar": {
          "admin_userVisibility": "visible",
          "injection": "auto-inject"
        },
        "contentGrids": {
          "admin_userVisibility": "hidden"
        },
        "games": {
          "admin_userVisibility": "hidden",
          "inject": false
        },
        "storyViewer": {
          "admin_userVisibility": "hidden"
        },
        "storyCarousel": {
          "admin_userVisibility": "visible-for-bloggers",
          "injection": "auto-inject",
          "injectionPosition": "after selector"
        },
        "storyExplorer": {
          "admin_userVisibility": "visible-for-bloggers",
          "injection": "auto-inject",
          "position": "after selector"
        },
        "videos": {
          "admin_userVisibility": "visible"
        },
        "campaigns": {
          "admin_userVisibility": "visible-for-business",
          "slotIds": []
        },
        "images": {
          "admin_userVisibility": "visible",
          "imageContainment": "auto",
          "placeholderImageContainment": "auto"
        },
        "exclusiveContent": {
          "enable": "default"
        },
        "journeyGuide": {
          "behavior": "auto"
        }
      },
      {
        "id": "unindexed",
        "internal_generated": true,
        "general": {
          "name": "Unindexed",
          "description": "Pages that do not appear in sitemaps"
        },
        "applicability": {
          "admin_userVisibility": "visible",
          "allowUnindexedPages": true,
          "pageUrls": [],
          "ldJsonSchemas": [],
          "sitemapTypes": [],
          "sitemapUrls": [],
          "groups": [],
          "categories": [],
          "bodyClasses": [],
          "themes": []
        },
        "indexing": {
          "admin_userVisibility": "visible"
        },
        "recommendations": {
          "admin_userVisibility": "visible"
        },
        "css": {
          "admin_userVisibility": "visible"
        },
        "floatingButtons": {
          "injection": "auto",
          "favoriteVisibility": "hidden",
          "searchVisibility": "auto",
          "backToTopVisibility": "auto"
        },
        "search": {
          "admin_userVisibility": "visible",
          "searchGroupNames": []
        },
        "searchHooks": {
          "admin_userVisibility": "visible",
          "apply": "auto",
          "selectors": []
        },
        "inlineSearch": {
          "admin_userVisibility": "visible",
          "inlineSearchIds": []
        },
        "filmstrip": {
          "admin_userVisibility": "visible",
          "injection": "do-not-inject",
          "position": "after selector"
        },
        "filmstripToolbar": {
          "admin_userVisibility": "visible",
          "injection": "auto-inject"
        },
        "contentGrids": {
          "admin_userVisibility": "hidden"
        },
        "games": {
          "admin_userVisibility": "hidden",
          "inject": false
        },
        "storyViewer": {
          "admin_userVisibility": "hidden"
        },
        "storyCarousel": {
          "admin_userVisibility": "visible-for-bloggers",
          "injection": "auto-inject",
          "injectionPosition": "after selector"
        },
        "storyExplorer": {
          "admin_userVisibility": "visible-for-bloggers",
          "injection": "auto-inject",
          "position": "after selector"
        },
        "videos": {
          "admin_userVisibility": "visible"
        },
        "campaigns": {
          "admin_userVisibility": "visible-for-business",
          "slotIds": []
        },
        "images": {
          "admin_userVisibility": "visible",
          "imageContainment": "auto",
          "placeholderImageContainment": "auto"
        },
        "exclusiveContent": {
          "enable": "default"
        },
        "journeyGuide": {
          "behavior": "auto"
        }
      }
    ]
  }
  
  
  `;

  // create config json file
  fs.writeFile("config.json", config, function (err) {
    if (err) throw err;
  });

 
}

// run(
//   "https://castandspear.com/","melissaringstaff@gmail.com"
// );

// cloudflare issue and post verification
// run(
//   "https://idealme.com/","info@idealme.com"
// );

