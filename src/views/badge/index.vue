<template>
  <div>
    <el-card>
      <el-row>
        <el-input
          v-model="search.name"
          placeholder="徽章名称"
          style="width: 200px; margin-right: 8px"
        />
        <el-button type="primary" @click="fetchData">搜索</el-button>
        <el-button @click="openDialog">新增徽章</el-button>
      </el-row>
      <el-table :data="tableData" style="margin-top: 16px">
        <el-table-column prop="id" label="徽章ID" width="80" />
        <el-table-column prop="name" label="徽章名称" />
        <el-table-column prop="code" label="徽章标识" />
        <el-table-column prop="imageUrl" label="图片">
          <template #default="scope">
            <el-image
              :src="scope.row.imageUrl"
              style="width: 40px; height: 40px"
              fit="cover"
            />
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="createTime" label="创建时间" />
        <el-table-column prop="updateTime" label="更新时间" />
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button size="small" @click="editBadge(scope.row)"
              >编辑</el-button
            >
            <el-button
              size="small"
              type="danger"
              @click="deleteBadge(scope.row.id)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" title="徽章管理" width="500px">
      <el-form :model="form">
        <el-form-item label="徽章名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="徽章标识">
          <el-input v-model="form.code" type="number" />
        </el-form-item>
        <el-form-item label="图片URL">
          <el-input v-model="form.imageUrl" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const search = ref({ name: "" });
const tableData = ref([
  {
    id: 1,
    name: "学习达人",
    code: 1001,
    imageUrl: "https://example.com/badge1.png",
    description: "完成100次学习任务获得",
    createTime: "2026-03-17 10:00:00",
    updateTime: "2026-03-17 10:00:00"
  }
]);
const dialogVisible = ref(false);
const form = ref({
  id: null,
  name: "",
  code: 0,
  imageUrl: "",
  description: ""
});

function fetchData() {
  // TODO: 调用后端API获取数据
}
function openDialog() {
  form.value = { id: null, name: "", code: 0, imageUrl: "", description: "" };
  dialogVisible.value = true;
}
function editBadge(row: any) {
  form.value = { ...row };
  dialogVisible.value = true;
}
function deleteBadge(id: number) {
  // TODO: 调用后端API删除
}
function submitForm() {
  // TODO: 调用后端API保存
  dialogVisible.value = false;
}
</script>
