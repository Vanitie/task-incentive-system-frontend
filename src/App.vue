<template>
  <el-config-provider :locale="currentLocale">
    <router-view />
    <ReDialog />
  </el-config-provider>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import { ElConfigProvider } from "element-plus";
import { ReDialog } from "@/components/ReDialog";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import {
  getUserTotal,
  getActive7Days,
  getTodayUserCount,
  getTodayRewardReceivers
} from "@/api/welcome";

export default defineComponent({
  name: "app",
  components: {
    [ElConfigProvider.name]: ElConfigProvider,
    ReDialog
  },
  setup() {
    const userTotal = ref(0);
    const active7Days = ref(0);
    const todayUserCount = ref(0);
    const todayRewardReceivers = ref(0);

    onMounted(async () => {
      const res1 = await getUserTotal();
      userTotal.value = res1.data.value;
      const res2 = await getActive7Days();
      active7Days.value = res2.data.value;
      const res3 = await getTodayUserCount();
      todayUserCount.value = res3.data.value;
      const res4 = await getTodayRewardReceivers();
      todayRewardReceivers.value = res4.data.value;
    });

    return {
      userTotal,
      active7Days,
      todayUserCount,
      todayRewardReceivers,
      currentLocale: zhCn
    };
  }
});
</script>
