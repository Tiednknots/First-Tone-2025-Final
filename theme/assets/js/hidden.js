<script>
  window.addEventListener("DOMContentLoaded", function () {
    const banner = document.querySelector("body > udesly-banner");
    if (banner) {
      banner.remove(); // 💥 Gone!
      console.log("🔥 udesly-banner removed");
    }
  });
</script>
