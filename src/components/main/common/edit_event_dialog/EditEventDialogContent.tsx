import * as React from 'react';
import Box from '@mui/material/Box';
import {
  Button,
  CircularProgress,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from '@mui/material';
import { z } from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { Dispatch, SetStateAction } from 'react';
import { TextFieldRHF } from '../../../common/TextFieldRHF';
import { DatePickerRHF } from '../../../common/DatePickerRHF';
import {
  PatchEventRequestBody,
  PatchEventResponseSuccessBody,
} from '@/pages/api/events/[id]';
import { EventT } from '@/types/EventT';
import { useSnackbarContext } from '@/components/common/SnackbarProvider';

const eventScheme = z
  .object({
    title: z
      .string()
      .min(1, { message: 'イベントタイトルを入力してください' })
      .max(50, { message: 'イベントタイトルが長すぎます' }),
    startDateTime: z.date(),
    endDateTime: z.date().nullable(), //nullかも
    place: z.string().max(100, { message: '文字数超過' }).nullable(),
    url: z.string().max(200, { message: '文字数超過' }).nullable(),
    member: z.string().max(100, { message: '文字数超過' }).nullable(),
    memo: z.string().max(255, { message: '文字数超過' }).nullable(),
    diary: z.string().max(10000, { message: '文字数超過' }).nullable(),
    success: z.union([z.literal('true'), z.literal('false')]).nullable(),
    //literal・・・文字通りの　union・・・orの意味　typescriptの|
    //radiocomponentでvalueがstringのみ使用可能だった為、一度string型に。
  })
  .refine(
    //終了日時がnull、もしくは(||)終了時刻が開始日時より後の場合正しい入力値とする。
    (data) => !data.endDateTime || data.startDateTime <= data.endDateTime,
    {
      message: '終了日時は開始日時の後に設定してください',
      path: ['endDateTime'],
    }
  );
type EventSchemaType = z.infer<typeof eventScheme>;

type Props = {
  onClose: () => void;
  event: EventT;
  afterSaveEvent: () => void;
};

export const EditEventDialogContent = ({
  onClose,
  event,
  afterSaveEvent,
}: Props) => {
  const {
    //何を使うか
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EventSchemaType>({
    //<型>(中身：オブジェクトの形)
    resolver: zodResolver(eventScheme),
    mode: 'onSubmit',
    criteriaMode: 'all',
    defaultValues: {
      title: event.title,
      startDateTime: new Date(event.startDateTime),
      endDateTime: event.endDateTime ? new Date(event.endDateTime) : null,
      place: event.place,
      url: event.url,
      member: event.member,
      memo: event.memo,
      diary: event.diary,
      //boolean型に戻した↓
      success:
        event.success === null
          ? null
          : (event.success.toString() as 'true' | 'false'),
    },
  });
  const { setSnackbarMessage, setIsSnackbarOpen } = useSnackbarContext();

  const onEditEvent = (data: EventSchemaType) => {
    const patchData: PatchEventRequestBody = {
      title: data.title,
      startDateTime: data.startDateTime.toISOString(),
      endDateTime: data.endDateTime?.toISOString() || null,
      place: data.place || null,
      url: data.url || null,
      member: data.member || null,
      memo: data.memo || null,
      diary: data.diary || null,
      success:
        data.success === null ? null : data.success === 'true' ? true : false,
    };

    axios
      .patch<PatchEventResponseSuccessBody>(
        `/api/events/${event.id}`,
        patchData
      ) //patchする
      .then(() => {
        setSnackbarMessage({
          severity: 'success',
          text: 'イベント編集完了',
        });
        afterSaveEvent();
        setIsSnackbarOpen(true);
        onClose();
      })
      .catch((error) => {
        setSnackbarMessage({
          severity: 'error',
          text: 'イベントの編集に失敗しました。',
        });
        setIsSnackbarOpen(true);
      });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit(onEditEvent)}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          padding: '32px',
          width: '100%',
        }}
      >
        <TextFieldRHF<EventSchemaType>
          control={control}
          name="title"
          label="イベントタイトル"
        />
        <Box
          sx={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          <DatePickerRHF<EventSchemaType>
            name="startDateTime"
            control={control}
            label="開催日時"
          />
          <Box> ~ </Box>
          <DatePickerRHF<EventSchemaType>
            name="endDateTime"
            control={control}
            label="終了日時"
          />
        </Box>
        <TextFieldRHF<EventSchemaType>
          control={control}
          name="place"
          label="開催場所"
        />
        <TextFieldRHF<EventSchemaType>
          control={control}
          name="url"
          label="イベントページURL"
          // リンクつける
        />
        <TextFieldRHF<EventSchemaType>
          control={control}
          name="member"
          label="同行メンバー"
        />
        <TextFieldRHF<EventSchemaType>
          control={control}
          name="memo"
          label="詳細memo"
        />

        <TextFieldRHF<EventSchemaType>
          control={control}
          name="diary"
          label="イベントレポート"
        />

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <FormLabel id="success">脱出 </FormLabel>
          <Controller
            control={control}
            name="success"
            render={({ field }) => (
              <RadioGroup
                ref={field.ref}
                row
                aria-labelledby="radio-buttons-group-label"
                name={field.name}
                onChange={field.onChange}
                value={field.value}
              >
                <FormControlLabel
                  value="true"
                  control={<Radio disabled={field.disabled} />}
                  label="成功!!"
                  sx={{ color: '#0066CC' }}
                />
                <FormControlLabel
                  value="false"
                  control={<Radio disabled={field.disabled} />}
                  label="失敗"
                  sx={{ color: '#FF9872' }}
                />
              </RadioGroup>
            )}
          />
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Button
            onClick={onClose}
            variant="contained"
            sx={{
              width: '100px',
              marginTop: '16px',
              fontSize: 'small',
              backgroundColor: 'gray',
              color: 'white',
              margin: '8px',
            }}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            variant="contained"
            sx={{ width: '150px', marginTop: '16px', margin: '8px' }}
          >
            編集
          </Button>
        </Box>
      </Box>
    </Box>
  );
};