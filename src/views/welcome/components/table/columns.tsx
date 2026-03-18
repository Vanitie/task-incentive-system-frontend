import { delay } from "@pureadmin/utils";
import { ref, watch, reactive } from "vue";
import type { Ref } from "vue";
import type { PaginationProps } from "@pureadmin/table";
// import ThumbUp from "~icons/ri/thumb-up-line";
// import Hearts from "~icons/ri/hearts-line";
import Empty from "./empty.svg?component";

export function useColumns(propsData: Ref<any[]>) {
  const dataList = ref<any[]>([]);
  const loading = ref(false);
  const columns: TableColumnList = [
    {
      sortable: true,
      label: "统计日期",
      prop: "statDate"
    },
    {
      sortable: true,
      label: "用户总数",
      prop: "userTotal",
      filterMultiple: false,
      filterClassName: "pure-table-filter",
      filters: [
        { text: "≥16000", value: "more" },
        { text: "<16000", value: "less" }
      ],
      filterMethod: (value, { userTotal }) => {
        return value === "more" ? userTotal >= 16000 : userTotal < 16000;
      }
    },
    {
      sortable: true,
      label: "活跃用户数",
      prop: "activeUser"
    },
    {
      sortable: true,
      label: "领取任务数",
      prop: "taskReceived"
    },
    {
      sortable: true,
      label: "完成任务数",
      prop: "taskCompleted"
    },
    {
      sortable: true,
      label: "完成率",
      minWidth: 100,
      prop: "completionRate"
    },
    {
      label: "操作",
      fixed: "right",
      slot: "operation"
    }
  ];

  /** 分页配置 */
  const pagination = reactive<PaginationProps>({
    pageSize: 10,
    currentPage: 1,
    layout: "prev, pager, next",
    total: 0,
    align: "center"
  });

  function onCurrentChange(page: number) {
    console.log("onCurrentChange", page);
    loading.value = true;
    delay(300).then(() => {
      loading.value = false;
    });
  }

  watch(
    propsData,
    val => {
      dataList.value = Array.isArray(val) ? val : [];
      pagination.total = dataList.value.length;
    },
    { immediate: true }
  );

  return {
    Empty,
    loading,
    columns,
    dataList,
    pagination,
    onCurrentChange
  };
}
