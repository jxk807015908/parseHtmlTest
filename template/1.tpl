<div>
    <ui v-if="type === 1" @mousedown.native="handleMouseDown" title="sda">
        <li v-for="item in list" :class="{'is-active': item.val === active}" v-bind:config="config">
            label: {{item.label}}
        </li>
        <a inline-template></a>
    </ui>
    <ui v-else-if="type === 2">
        <li v-for="(item, index, index2) in list" :ref="index" class="class-name" v-once v-bind:item="item" @click.prevent="handleClick">
            index
        </li>
    </ui>
    <ui v-else>
        <li .innerHtml="innerHtml" v-scroll-drag:[state]="aaaa">
            <slot name="content" :item="item"></slot>
            <slot :name="content" :item="item"></slot>
        </li>
        <input value="val" />
    </ui>
    <p v-pre :key="key" v-on:click="click">
        <span  @mousedown.native="handleMouseDown"></span>
    </p>
    <dj-scroll-box ref="box">
        <div slot="empty" slot-scope="scope">aaaaaa</div>
        <div :slot="slotName" slot-scope="scope">aaaaaa</div>
        <template v-slot="ssss"></template>
        <template v-slot:[slotName]="ssss"></template>
        <template v-slot:header="ssss"></template>
    </dj-scroll-box>
    <component :is="table" v-once></component>
</div>