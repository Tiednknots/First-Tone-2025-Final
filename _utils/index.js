const registerFilters = require('./filters');
const registerCollections = require('./collections');
const registerTransforms = require('./transforms');
const registerShortcodes = require('./shortcodes');
const addFilesToFunctions = require('./zip')

module.exports = function (eleventyConfig) {

    eleventyConfig.setQuietMode(true);

    eleventyConfig.setLiquidOptions({
        dynamicPartials: true,
    });

    registerCollections(eleventyConfig);

    registerFilters(eleventyConfig);

    registerTransforms(eleventyConfig);

    registerShortcodes(eleventyConfig);

    eleventyConfig.addNunjucksFilter("dateLastMod", function(value) {
        try {
            return value.toISOString();
        } catch(e) {
            return new Date().toISOString();
        }
     });

    eleventyConfig.addNunjucksFilter("jsonCaseStudies", function(collection) {
        if (!Array.isArray(collection)) return "[]";
        const items = collection.map(item => {
            const d = item.data || {};
            return {
                title: d.title || '',
                slug: d.slug || '',
                challenge: d.f_challenge || '',
                client_details: d['f_client-details'] || '',
                project_overview: d['f_project-overview'] || '',
                video_url: d['f_video-url'] || '',
                link_to_video: d['f_link-to-video'] || '',
                main_image: d['f_main-image'] || null,
                mobile_image: d['f_mobile-image'] || null,
                gallery_images: d['f_gallery-images'] || [],
                short_desc: d['f_short-desc'] || '',
                home_video_order: d['f_home-video-order'] || 99,
                work_video_order: d['f_work-video-order'] || 99
            };
        });
        return JSON.stringify(items);
    });

    eleventyConfig.addNunjucksFilter("jsonServices", function(collection) {
        if (!Array.isArray(collection)) return "[]";
        const items = collection.map(item => {
            const d = item.data || {};
            return {
                title: d.title || '',
                slug: d.slug || '',
                f_short_description: d.f_short_description || d['f_short-desc'] || '',
                body: item.templateContent || d.body || '',
                f_image: d.f_image || d['f_main-image'] || null
            };
        });
        return JSON.stringify(items);
    });

    eleventyConfig.addNunjucksFilter("jsonPartnerships", function(collection) {
        if (!Array.isArray(collection)) return "[]";
        const items = collection.map(item => {
            const d = item.data || {};
            return {
                title: d.title || '',
                slug: d.slug || '',
                f_short_description: d.f_short_description || d['f_short-desc'] || '',
                body: item.templateContent || d.body || '',
                f_image: d.f_image || d['f_main-image'] || null
            };
        });
        return JSON.stringify(items);
    });

    eleventyConfig.on('afterBuild', async () => {
        await addFilesToFunctions();
    });
}